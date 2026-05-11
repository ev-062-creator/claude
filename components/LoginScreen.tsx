"use client";
import React, { useState } from "react";
import { Building2, Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import type { AuthResult, AuthStep } from "@/hooks/useAuth";

interface Props {
  step: AuthStep;
  pendingEmail: string;
  onLogin: (email: string, password: string) => Promise<AuthResult>;
  onVerify: (code: string) => Promise<AuthResult>;
  onBack: () => void;
}

export default function LoginScreen({ step, pendingEmail, onLogin, onVerify, onBack }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmitCreds(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { ok, error: err } = await onLogin(email, password);
    if (!ok) setError(err || "Erro ao entrar");
    setLoading(false);
  }

  async function handleSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { ok, error: err } = await onVerify(code);
    if (!ok) {
      setError(err || "Código incorreto");
      setCode("");
    }
    setLoading(false);
  }

  function handleBack() {
    setCode("");
    setError("");
    onBack();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Novo Mundo</h1>
          <p className="text-sm text-muted-foreground mt-1">Ecommerce · Cronograma de Pagamentos</p>
        </div>

        {step === "credentials" ? (
          <div className="rounded-2xl border bg-card shadow-lg p-6">
            <h2 className="text-base font-semibold mb-1">Entrar</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Após a senha você receberá um código de 6 dígitos por e-mail.
            </p>
            <form onSubmit={handleSubmitCreds} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loading ? "Enviando código..." : "Continuar"}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card shadow-lg p-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
              type="button"
            >
              <ArrowLeft className="h-3 w-3" /> Voltar
            </button>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">Verificação em duas etapas</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Enviamos um código de 6 dígitos para{" "}
              <span className="font-medium text-foreground">{pendingEmail}</span>. Verifique sua caixa de entrada.
            </p>
            <form onSubmit={handleSubmitCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Código de verificação</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                  placeholder="000000"
                  required
                  autoFocus
                  className="w-full px-3 py-3 rounded-lg border bg-background text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
                />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loading ? "Verificando..." : "Verificar e entrar"}
              </button>
            </form>
            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              O código expira em 10 minutos.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Novo Mundo © {new Date().getFullYear()} · Acesso restrito
        </p>
      </div>
    </div>
  );
}
