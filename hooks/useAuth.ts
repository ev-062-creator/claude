"use client";
import { useState, useEffect, useCallback } from "react";

const SESSION_KEY = "nm_session_v1";
const PENDING_KEY = "nm_2fa_pending_v1";
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8h
const PENDING_TTL = 10 * 60 * 1000; // 10min
const ENDPOINT = "/.netlify/functions/auth-2fa";

export type AuthStep = "credentials" | "code";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<AuthStep>("credentials");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingToken, setPendingToken] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const { ts } = JSON.parse(raw);
        if (Date.now() - ts < SESSION_TTL) {
          setIsLoggedIn(true);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
      const pending = sessionStorage.getItem(PENDING_KEY);
      if (pending) {
        const { email, token, ts } = JSON.parse(pending);
        if (Date.now() - ts < PENDING_TTL) {
          setPendingEmail(email);
          setPendingToken(token);
          setStep("code");
        } else {
          sessionStorage.removeItem(PENDING_KEY);
        }
      }
    } catch {}
    setChecking(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || "Erro ao validar credenciais" };
      }
      const emailNorm = email.trim().toLowerCase();
      setPendingEmail(emailNorm);
      setPendingToken(data.token);
      setStep("code");
      try {
        sessionStorage.setItem(
          PENDING_KEY,
          JSON.stringify({ email: emailNorm, token: data.token, ts: Date.now() })
        );
      } catch {}
      return { ok: true };
    } catch {
      return { ok: false, error: "Erro de conexão" };
    }
  }, []);

  const verifyCode = useCallback(async (code: string): Promise<AuthResult> => {
    if (!pendingToken) return { ok: false, error: "Sessão expirada, faça login novamente" };
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code, token: pendingToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || "Código incorreto" };
      }
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now() }));
        sessionStorage.removeItem(PENDING_KEY);
      } catch {}
      setIsLoggedIn(true);
      setPendingEmail("");
      setPendingToken("");
      setStep("credentials");
      return { ok: true };
    } catch {
      return { ok: false, error: "Erro de conexão" };
    }
  }, [pendingToken]);

  const cancelCodeStep = useCallback(() => {
    setStep("credentials");
    setPendingEmail("");
    setPendingToken("");
    try { sessionStorage.removeItem(PENDING_KEY); } catch {}
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(PENDING_KEY);
    } catch {}
    setIsLoggedIn(false);
    setStep("credentials");
    setPendingEmail("");
    setPendingToken("");
  }, []);

  return { isLoggedIn, checking, step, pendingEmail, login, verifyCode, cancelCodeStep, logout };
}
