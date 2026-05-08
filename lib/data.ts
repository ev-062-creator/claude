import type { Payment, Vendor } from "./types";

// ─── DATE HELPERS ────────────────────────────────────────────────────────────

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
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

// If date falls on Saturday → Monday; Sunday → Monday
function toBizDay(d: Date): Date {
  const day = d.getDay();
  if (day === 6) return addDays(d, 2);
  if (day === 0) return addDays(d, 1);
  return d;
}

// Schedule start: Monday 11/05/2026
const S = new Date(2026, 4, 11);

// ─── VENDORS ────────────────────────────────────────────────────────────────

export const VENDORS: Vendor[] = [
  {
    id: "clearsale",
    name: "Clear Sale",
    color: "#F97316",
    bg: "#FFF7ED",
    totalOwed: 7 * 25000 + 11751.81, // 8 parcelas totais; 2 já pagas
    paymentType: "semanal",
    relationshipStatus: "ativo",
    totalInstallments: 8,
    monthlyFee: 10000,
    notes: "8 parcelas semanais (2 primeiras já pagas). Mensalidade corrente ~R$ 10.000/mês",
  },
  {
    id: "pmweb",
    name: "PM Web",
    color: "#3B82F6",
    bg: "#EFF6FF",
    totalOwed: 10 * 7040.25,
    paymentType: "semanal",
    relationshipStatus: "sem-servico",
    totalInstallments: 10,
    notes: "10 parcelas semanais de R$ 7.040,25 — toda terça",
  },
  {
    id: "jucemar",
    name: "Jucemar / Numai",
    color: "#16A34A",
    bg: "#F0FDF4",
    totalOwed: 12 * 17013,
    paymentType: "mensal",
    relationshipStatus: "ativo",
    totalInstallments: 12,
    notes: "12 parcelas mensais de R$ 17.013,00 — vencimento dia 11 de cada mês",
  },
  {
    id: "oto",
    name: "OTO",
    color: "#CA8A04",
    bg: "#FEFCE8",
    totalOwed: 11 * 13636.36,
    paymentType: "mensal",
    relationshipStatus: "romper",
    totalInstallments: 11,
    monthlyFee: 19000,
    notes: "Romper contrato — mensalidade atual R$ 19.000. 11 parcelas até encerrar.",
  },
  {
    id: "wake",
    name: "Wake",
    color: "#7C3AED",
    bg: "#F5F3FF",
    totalOwed: 34000 + 10 * 7171.67,
    paymentType: "mensal",
    relationshipStatus: "ativo",
    totalInstallments: 11,
    notes: "Stand by. Entrada R$ 34.000 em 15/05 + 10 × R$ 7.171,67 (jun/26–mar/27)",
  },
  {
    id: "hiplatform",
    name: "Hiplatform",
    color: "#6B7280",
    bg: "#F9FAFB",
    totalOwed: 7000,
    paymentType: "sem-previsao",
    relationshipStatus: "romper",
    monthlyFee: 1100,
    notes: "Romper contrato. Mensalidade R$ 1.100. Saldo: R$ 7.000",
  },
  {
    id: "vtex",
    name: "VTEX",
    color: "#DC2626",
    bg: "#FEF2F2",
    totalOwed: 230723.59,
    paymentType: "sem-previsao",
    relationshipStatus: "a-negociar",
    monthlyFee: 40000,
    notes: "R$ 161.617,20 em atraso de R$ 230.723,59 total. Custo médio R$ 40.000/mês",
  },
  {
    id: "googleads",
    name: "Google Ads",
    color: "#4F46E5",
    bg: "#EEF2FF",
    totalOwed: 917023.28,
    paymentType: "sem-previsao",
    relationshipStatus: "a-negociar",
    notes: "Saldo devedor: R$ 917.023,28",
  },
  {
    id: "blue",
    name: "Blue",
    color: "#0891B2",
    bg: "#ECFEFF",
    totalOwed: 28316.46,
    paymentType: "sem-previsao",
    relationshipStatus: "a-negociar",
    notes: "Saldo devedor: R$ 28.316,46",
  },
  {
    id: "bing",
    name: "Bing",
    color: "#DB2777",
    bg: "#FDF2F8",
    totalOwed: 17000,
    paymentType: "sem-previsao",
    relationshipStatus: "a-negociar",
    notes: "Saldo devedor: R$ 17.000",
  },
  {
    id: "felipedesign",
    name: "Felipe Design",
    color: "#059669",
    bg: "#ECFDF5",
    totalOwed: 5000,
    paymentType: "sem-previsao",
    relationshipStatus: "a-negociar",
    notes: "Saldo devedor: R$ 5.000",
  },
];

export const VENDOR_MAP = Object.fromEntries(
  VENDORS.map((v) => [v.id, v])
) as Record<string, Vendor>;

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

function buildPayments(): Payment[] {
  const list: Payment[] = [];

  // Clear Sale — 8 segundas a partir de 11/05 (parcelas 1–8)
  // Parcelas 1 e 2 são pré-pagas (pre-seeded no localStorage)
  for (let i = 0; i < 8; i++) {
    const d = addDays(S, i * 7); // Monday
    list.push({
      id: `cs-${i + 1}`,
      vendorId: "clearsale",
      date: toISO(d),
      amount: i < 7 ? 25000 : 11751.81,
      installmentNumber: i + 1,
      totalInstallments: 8,
      label: i < 7 ? `Parcela ${i + 1}/8` : `Residual 8/8`,
      frequency: "semanal",
    });
  }

  // Clear Sale — mensalidade de serviço ~R$10k (mai, jun, jul 2026)
  [
    { date: "2026-05-15", label: "Mensalidade Mai/26" },
    { date: "2026-06-15", label: "Mensalidade Jun/26" },
    { date: "2026-07-03", label: "Mensalidade Jul/26" },
  ].forEach(({ date, label }, i) => {
    list.push({
      id: `cs-fee-${i + 1}`,
      vendorId: "clearsale",
      date,
      amount: 10000,
      label,
      frequency: "mensalidade",
      isMonthlyFee: true,
    });
  });

  // PM Web — 10 terças a partir de 12/05
  for (let i = 0; i < 10; i++) {
    const d = addDays(S, 1 + i * 7); // Tuesday
    list.push({
      id: `pm-${i + 1}`,
      vendorId: "pmweb",
      date: toISO(d),
      amount: 7040.25,
      installmentNumber: i + 1,
      totalInstallments: 10,
      label: `Parcela ${i + 1}/10`,
      frequency: "semanal",
    });
  }

  // Jucemar — 12 mensais dia 11 (mai/26 a abr/27), ajustado para dia útil
  for (let i = 0; i < 12; i++) {
    const raw = new Date(2026, 4 + i, 11);
    const d = toBizDay(raw);
    list.push({
      id: `jc-${i + 1}`,
      vendorId: "jucemar",
      date: toISO(d),
      amount: 17013,
      installmentNumber: i + 1,
      totalInstallments: 12,
      label: `Parcela ${i + 1}/12`,
      frequency: "mensal",
    });
  }

  // OTO — 11 mensais dia 15 a partir de 15/05/2026
  for (let i = 0; i < 11; i++) {
    const d = new Date(2026, 4 + i, 15);
    list.push({
      id: `oto-${i + 1}`,
      vendorId: "oto",
      date: toISO(d),
      amount: 13636.36,
      installmentNumber: i + 1,
      totalInstallments: 11,
      label: `Parcela ${i + 1}/11`,
      frequency: "mensal",
    });
  }

  // Wake — entrada 15/05/2026
  list.push({
    id: "wake-0",
    vendorId: "wake",
    date: "2026-05-15",
    amount: 34000,
    installmentNumber: 1,
    totalInstallments: 11,
    label: "Entrada",
    frequency: "entrada",
  });

  // Wake — 10 mensais dia 15 (jun/26 a mar/27)
  for (let i = 0; i < 10; i++) {
    const d = new Date(2026, 5 + i, 15);
    list.push({
      id: `wake-${i + 1}`,
      vendorId: "wake",
      date: toISO(d),
      amount: 7171.67,
      installmentNumber: i + 2,
      totalInstallments: 11,
      label: `Parcela ${i + 1}/10`,
      frequency: "mensal",
    });
  }

  return list;
}

export const ALL_PAYMENTS: Payment[] = buildPayments();

// IDs que entram pré-pagos no localStorage (Clear Sale parcelas 1 e 2)
export const PRE_PAID_IDS: string[] = ["cs-1", "cs-2"];

// ─── WEEK SCHEDULE ───────────────────────────────────────────────────────────

export const NUM_WEEKS = 22;
export const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

export interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: { date: string; label: string; payments: Payment[]; total: number }[];
  total: number;
}

export function buildWeeks(payments: Payment[]): WeekData[] {
  const byDate: Record<string, Payment[]> = {};
  for (const p of payments) {
    (byDate[p.date] ??= []).push(p);
  }

  return Array.from({ length: NUM_WEEKS }, (_, w) => {
    const mon = addDays(S, w * 7);
    const fri = addDays(mon, 4);
    let total = 0;
    const days = Array.from({ length: 5 }, (_, d) => {
      const day = addDays(mon, d);
      const date = toISO(day);
      const dayPayments = byDate[date] ?? [];
      const dayTotal = dayPayments.reduce((s, p) => s + p.amount, 0);
      total += dayTotal;
      return { date, label: DAY_LABELS[d], payments: dayPayments, total: dayTotal };
    });
    return { weekNumber: w + 1, startDate: toISO(mon), endDate: toISO(fri), days, total };
  });
}

// ─── TOTALS ──────────────────────────────────────────────────────────────────

export function computeTotals(vendors = VENDORS) {
  const comAcordo = vendors.filter((v) => v.paymentType !== "sem-previsao").reduce((s, v) => s + v.totalOwed, 0);
  const semPrevisao = vendors.filter((v) => v.paymentType === "sem-previsao").reduce((s, v) => s + v.totalOwed, 0);
  return { comAcordo, semPrevisao, total: comAcordo + semPrevisao };
}
