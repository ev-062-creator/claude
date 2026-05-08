"use client";
import { useState, useEffect, useCallback } from "react";

const SESSION_KEY = "nm_session_v1";
const SESSION_TTL = 8 * 60 * 60 * 1000;

const EMAIL = "jevaldocosta@gmail.com";
const PWD_B64 = "Tm92YU11bmRvQDIwMjY="; // btoa("NovaMundo@2026")

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const { ts } = JSON.parse(raw);
        if (Date.now() - ts < SESSION_TTL) setIsLoggedIn(true);
        else sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {}
    setChecking(false);
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const ok = email.trim().toLowerCase() === EMAIL && btoa(password) === PWD_B64;
    if (ok) {
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now() })); } catch {}
      setIsLoggedIn(true);
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setIsLoggedIn(false);
  }, []);

  return { isLoggedIn, checking, login, logout };
}
