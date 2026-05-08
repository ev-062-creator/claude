import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RelationshipStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── FORMATTERS ──────────────────────────────────────────────────────────────

export function fmt(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtCompact(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return fmt(v);
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function monthShort(iso: string): string {
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const [y, m] = iso.split("-");
  return `${months[Number(m) - 1]}/${String(y).slice(2)}`;
}

export const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export function isoYear(iso: string): number { return Number(iso.slice(0, 4)); }
export function isoMonth(iso: string): number { return Number(iso.slice(5, 7)); }

export function todayISO(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

// ─── VENDOR BADGES ───────────────────────────────────────────────────────────

export function statusLabel(s: RelationshipStatus): string {
  const map: Record<RelationshipStatus, string> = {
    ativo: "Ativo",
    romper: "Romper",
    "sem-servico": "Sem serviço",
    "a-negociar": "A negociar",
  };
  return map[s];
}

export function statusIcon(s: RelationshipStatus): string {
  const map: Record<RelationshipStatus, string> = {
    ativo: "🟢",
    romper: "🔴",
    "sem-servico": "⚫",
    "a-negociar": "🟡",
  };
  return map[s];
}

export function statusColor(s: RelationshipStatus): string {
  const map: Record<RelationshipStatus, string> = {
    ativo: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    romper: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "sem-servico": "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    "a-negociar": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return map[s];
}

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────

export function exportCSV(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => String(r[h]).replace(/;/g, ",")).join(";")),
  ].join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
