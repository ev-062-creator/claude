// Netlify Function: 2FA por email com Resend
// Variáveis de ambiente esperadas:
//   RESEND_API_KEY  — chave do Resend
//   TFA_SECRET      — segredo aleatório (ex: openssl rand -hex 32)
//   AUTH_EMAIL      — email autorizado
//   AUTH_PASSWORD   — senha autorizada
//   FROM_EMAIL      — remetente (default: onboarding@resend.dev)

const crypto = require("crypto");

const TFA_SECRET = process.env.TFA_SECRET || "";
const AUTH_EMAIL = (process.env.AUTH_EMAIL || "").trim().toLowerCase();
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function json(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

function sign(payload) {
  return crypto.createHmac("sha256", TFA_SECRET).update(payload).digest("hex");
}

function timingSafeEqual(a, b) {
  const aB = Buffer.from(a);
  const bB = Buffer.from(b);
  if (aB.length !== bB.length) return false;
  return crypto.timingSafeEqual(aB, bB);
}

function createToken(email, code) {
  const exp = Date.now() + CODE_TTL_MS;
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  const payload = JSON.stringify({ email, codeHash, exp });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = sign(encoded);
  return encoded + "." + sig;
}

function verifyToken(token) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  let expected;
  try {
    expected = sign(encoded);
  } catch {
    return null;
  }
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

async function sendEmail(to, code) {
  const html =
    '<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1f2937;">' +
    '<h2 style="margin:0 0 8px 0;color:#111;">Novo Mundo — Ecommerce</h2>' +
    '<p style="color:#6b7280;margin:0 0 20px 0;font-size:14px;">Cronograma de Pagamentos</p>' +
    '<p style="color:#374151;margin:0 0 12px 0;">Seu código de verificação é:</p>' +
    '<div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f3f4f6;padding:16px;text-align:center;border-radius:8px;color:#111;font-family:ui-monospace,Menlo,monospace;">' +
    code +
    "</div>" +
    '<p style="color:#9ca3af;font-size:12px;margin-top:20px;">Este código expira em 10 minutos. Se não foi você que tentou entrar, ignore este email.</p>' +
    "</div>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Novo Mundo <" + FROM_EMAIL + ">",
        to: [to],
        subject: "Código de verificação: " + code,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Resend error:", res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend exception:", err);
    return false;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: {}, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }
  if (!TFA_SECRET || !AUTH_EMAIL || !AUTH_PASSWORD || !RESEND_API_KEY) {
    return json(500, { error: "Servidor não configurado (variáveis de ambiente ausentes)" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "JSON inválido" });
  }

  const { action } = body;

  if (action === "send") {
    const { email, password } = body;
    if (typeof email !== "string" || typeof password !== "string") {
      return json(400, { error: "Campos obrigatórios" });
    }
    const emailNorm = email.trim().toLowerCase();
    if (emailNorm !== AUTH_EMAIL || password !== AUTH_PASSWORD) {
      return json(401, { error: "E-mail ou senha incorretos" });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const token = createToken(emailNorm, code);
    const sent = await sendEmail(emailNorm, code);
    if (!sent) {
      return json(500, { error: "Falha ao enviar o e-mail. Tente novamente." });
    }
    return json(200, { ok: true, token });
  }

  if (action === "verify") {
    const { code, token } = body;
    if (typeof code !== "string" || typeof token !== "string") {
      return json(400, { error: "Campos obrigatórios" });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return json(401, { error: "Sessão expirada. Faça login novamente." });
    }
    const codeHash = crypto.createHash("sha256").update(code.trim()).digest("hex");
    if (!timingSafeEqual(codeHash, payload.codeHash)) {
      return json(401, { error: "Código incorreto" });
    }
    return json(200, { ok: true });
  }

  return json(400, { error: "Ação desconhecida" });
};
