"use client";
import { useState, useEffect, useCallback } from "react";
import { ALL_PAYMENTS, PRE_PAID_IDS } from "@/lib/data";
import type { Payment } from "@/lib/types";

const KEY = "nm_paid_v3";
const SEED_KEY = "nm_seeded_v3";

export function usePayments() {
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const seeded = localStorage.getItem(SEED_KEY);
      if (raw) {
        const stored = new Set<string>(JSON.parse(raw));
        if (!seeded) {
          PRE_PAID_IDS.forEach((id) => stored.add(id));
          localStorage.setItem(KEY, JSON.stringify([...stored]));
          localStorage.setItem(SEED_KEY, "1");
        }
        setPaidIds(stored);
      } else {
        const initial = new Set<string>(PRE_PAID_IDS);
        setPaidIds(initial);
        localStorage.setItem(KEY, JSON.stringify([...initial]));
        localStorage.setItem(SEED_KEY, "1");
      }
    } catch {}
  }, []);

  const togglePaid = useCallback((id: string) => {
    setPaidIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem(KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const payments: Payment[] = ALL_PAYMENTS;

  return { payments, paidIds, togglePaid };
}
