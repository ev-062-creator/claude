"use client";
import { useState, useEffect, useCallback } from "react";
import type { Payment } from "@/lib/types";

const KEY = "nm_custom_fees_v2";
const LEGACY_KEYS = ["nm_custom_fees_v1"];

function load(): Payment[] {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function persist(fees: Payment[]) {
  try { localStorage.setItem(KEY, JSON.stringify(fees)); } catch {}
}

export function useCustomFees() {
  const [customFees, setCustomFees] = useState<Payment[]>([]);

  useEffect(() => {
    try { for (const k of LEGACY_KEYS) localStorage.removeItem(k); } catch {}
    setCustomFees(load());
  }, []);

  const addFee = useCallback((fee: Omit<Payment, "id">) => {
    const newFee: Payment = { ...fee, id: `fee-custom-${Date.now()}` };
    setCustomFees((prev) => {
      const next = [...prev, newFee];
      persist(next);
      return next;
    });
  }, []);

  const deleteFee = useCallback((id: string) => {
    setCustomFees((prev) => {
      const next = prev.filter((f) => f.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { customFees, addFee, deleteFee };
}
