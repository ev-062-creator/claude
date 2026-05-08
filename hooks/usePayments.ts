"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ALL_PAYMENTS, PRE_PAID_IDS, VENDORS as BASE_VENDORS } from "@/lib/data";
import type { Payment, Vendor } from "@/lib/types";

const KEY = "nm_paid_v3";
const SEED_KEY = "nm_seeded_v3";

// IDs dos fornecedores base (não customizados)
const BASE_IDS = new Set(BASE_VENDORS.map((v) => v.id));

// Agrupa pagamentos estáticos no nível do módulo (referência estável)
const STATIC_BY_VENDOR: Record<string, Payment[]> = {};
const STATIC_FEES: Payment[] = [];
for (const p of ALL_PAYMENTS) {
  if (p.isMonthlyFee) { STATIC_FEES.push(p); continue; }
  (STATIC_BY_VENDOR[p.vendorId] ??= []).push(p);
}
for (const id of Object.keys(STATIC_BY_VENDOR)) {
  STATIC_BY_VENDOR[id].sort((a, b) => a.date.localeCompare(b.date));
}

function toISO(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function bizDay(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay();
  if (day === 6) out.setDate(out.getDate() + 2);
  else if (day === 0) out.setDate(out.getDate() + 1);
  return out;
}

function stepDate(from: Date, steps: number, weekly: boolean): Date {
  const d = new Date(from);
  if (weekly) d.setDate(d.getDate() + steps * 7);
  else d.setMonth(d.getMonth() + steps);
  return bizDay(d);
}

export function usePayments(mergedVendors: Vendor[]) {
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

  const payments = useMemo((): Payment[] => {
    const result: Payment[] = [...STATIC_FEES];

    for (const vendor of mergedVendors) {
      // Fornecedores customizados não têm cronograma de parcelas
      if (!BASE_IDS.has(vendor.id)) continue;

      const staticPays = STATIC_BY_VENDOR[vendor.id] ?? [];
      const n = vendor.totalInstallments;

      // Sem parcelas definidas (sem-previsao etc.) — usa pagamentos estáticos
      if (!n) {
        result.push(...staticPays);
        continue;
      }

      const staticN = staticPays.length;

      // Quantidade não mudou — usa estáticos (preserva valores/datas exatos)
      if (n === staticN) {
        result.push(...staticPays);
        continue;
      }

      const isWeekly = vendor.paymentType === "semanal";
      const entrada = vendor.entrada ?? 0;
      const nRegular = Math.max(1, n - (entrada > 0 ? 1 : 0));
      const installAmt = (vendor.totalOwed - entrada) / nRegular;

      if (n < staticN) {
        // Truncar — menos parcelas que no estático
        result.push(
          ...staticPays.slice(0, n).map((p) => ({
            ...p,
            totalInstallments: n,
            label:
              p.frequency === "entrada"
                ? p.label
                : `Parcela ${p.installmentNumber ?? 1}/${n}`,
          }))
        );
      } else {
        // Mais parcelas — mantém estáticos + gera extras
        result.push(
          ...staticPays.map((p) => ({
            ...p,
            totalInstallments: n,
            label:
              p.frequency === "entrada"
                ? p.label
                : `Parcela ${p.installmentNumber ?? 1}/${n}`,
          }))
        );

        const anchor =
          staticPays.length > 0
            ? new Date(staticPays[staticPays.length - 1].date + "T12:00:00")
            : new Date("2026-05-11T12:00:00");

        for (let i = staticN; i < n; i++) {
          const d = stepDate(anchor, i - staticN + 1, isWeekly);
          result.push({
            id: `${vendor.id}-${i + 1}`,
            vendorId: vendor.id,
            date: toISO(d),
            amount: installAmt,
            installmentNumber: i + 1,
            totalInstallments: n,
            label: `Parcela ${i + 1}/${n}`,
            frequency: isWeekly ? "semanal" : "mensal",
          });
        }
      }
    }

    return result;
  }, [mergedVendors]);

  return { payments, paidIds, togglePaid };
}
