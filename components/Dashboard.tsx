"use client";
import React, { useMemo } from "react";
import { Wallet, AlertCircle, TrendingDown, CalendarClock, Layers, Repeat2 } from "lucide-react";
import { buildWeeks, computeTotals, ALL_PAYMENTS } from "@/lib/data";
import type { Vendor } from "@/lib/types";
import { fmt, fmtCompact, fmtDate, fmtDateShort, todayISO, statusLabel, statusColor, statusIcon, MONTH_NAMES, isoYear, isoMonth } from "@/lib/utils";
import type { Payment } from "@/lib/types";

interface Props {
  payments: Payment[];
  paidIds: Set<string>;
  dateFrom: string;
  dateTo: string;
  vendors: Vendor[];
  vendorMap: Record<string, Vendor>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>;
}

function SummaryCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  accent: "blue" | "amber" | "red" | "green" | "violet" | "indigo";
}) {
  const bg: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950/20",
    amber: "bg-amber-50 dark:bg-amber-950/20",
    red: "bg-red-50 dark:bg-red-950/20",
    green: "bg-green-50 dark:bg-green-950/20",
    violet: "bg-violet-50 dark:bg-violet-950/20",
    indigo: "bg-indigo-50 dark:bg-indigo-950/20",
  };
  return (
    <Card className={bg[accent]}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground font-medium">{label}</span></div>
        <p className="text-xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
      </div>
    </Card>
  );
}

export default function Dashboard({ payments, paidIds, dateFrom, dateTo, vendors, vendorMap }: Props) {
  const today = todayISO();
  const totals = computeTotals(vendors);

  const filtered = useMemo(() =>
    payments.filter((p) => (!dateFrom || p.date >= dateFrom) && (!dateTo || p.date <= dateTo)),
    [payments, dateFrom, dateTo]
  );

  const weeks = useMemo(() => buildWeeks(filtered), [filtered]);

  const currentWeek = useMemo(() =>
    weeks.find((w) => w.endDate >= today && w.total > 0) ?? weeks[0],
    [weeks, today]
  );

  const upcoming = useMemo(() => {
    const cutoff = (() => { const d = new Date(today); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10); })();
    return payments.filter((p) => p.date >= today && p.date <= cutoff && !paidIds.has(p.id)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);
  }, [payments, today, paidIds]);

  const progress = useMemo(() =>
    vendors.filter((v) => v.totalInstallments).map((v) => {
      const vp = payments.filter((p) => p.vendorId === v.id && !p.isMonthlyFee);
      const paid = vp.filter((p) => paidIds.has(p.id)).length;
      const total = v.totalInstallments!;
      return { vendor: v, paid, total, pct: total > 0 ? Math.round((paid / total) * 100) : 0 };
    }), [vendors, payments, paidIds]
  );

  // ── Aggregate installment stats (for summary cards)
  const installmentStats = useMemo(() => {
    let totalParcelas = 0, paidParcelas = 0, totalValue = 0, paidValue = 0;
    for (const row of progress) {
      totalParcelas += row.total;
      paidParcelas += row.paid;
      const ps = payments.filter((p) => p.vendorId === row.vendor.id && !p.isMonthlyFee);
      totalValue += ps.reduce((s, p) => s + p.amount, 0);
      paidValue += ps.filter((p) => paidIds.has(p.id)).reduce((s, p) => s + p.amount, 0);
    }
    return { totalParcelas, paidParcelas, totalValue, paidValue };
  }, [progress, payments, paidIds]);

  // ── Monthly fee (mensalidade) stats
  const feeStats = useMemo(() => {
    const fees = payments.filter((p) => p.isMonthlyFee);
    const paid = fees.filter((p) => paidIds.has(p.id));
    return {
      total: fees.length,
      paid: paid.length,
      totalValue: fees.reduce((s, p) => s + p.amount, 0),
      paidValue: paid.reduce((s, p) => s + p.amount, 0),
    };
  }, [payments, paidIds]);

  // ── Monthly totals
  const monthlyTotals = useMemo(() => {
    const map: Record<string, { scheduled: number; paid: number; key: string; label: string }> = {};
    for (const p of ALL_PAYMENTS) {
      const y = isoYear(p.date);
      const m = isoMonth(p.date);
      const key = `${y}-${String(m).padStart(2, "0")}`;
      if (!map[key]) map[key] = { scheduled: 0, paid: 0, key, label: `${MONTH_NAMES[m - 1]} ${y}` };
      map[key].scheduled += p.amount;
      if (paidIds.has(p.id)) map[key].paid += p.amount;
    }
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
  }, [paidIds]);

  const weekTotal = currentWeek?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary cards — row 1 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={<Wallet className="h-4 w-4 text-blue-500" />} label="Com acordo" value={fmtCompact(totals.comAcordo)} sub={fmt(totals.comAcordo)} accent="blue" />
        <SummaryCard icon={<AlertCircle className="h-4 w-4 text-amber-500" />} label="Sem previsão" value={fmtCompact(totals.semPrevisao)} sub={fmt(totals.semPrevisao)} accent="amber" />
        <SummaryCard icon={<TrendingDown className="h-4 w-4 text-red-500" />} label="Total geral" value={fmtCompact(totals.total)} sub={fmt(totals.total)} accent="red" />
        <SummaryCard
          icon={<CalendarClock className="h-4 w-4 text-violet-500" />}
          label={`Semana ${currentWeek?.weekNumber ?? 1}`}
          value={fmtCompact(weekTotal)}
          sub={currentWeek ? `${fmtDateShort(currentWeek.startDate)}–${fmtDateShort(currentWeek.endDate)}` : ""}
          accent={weekTotal > 35000 ? "red" : "green"}
        />
      </div>

      {/* Summary cards — row 2: acordos + mensalidades */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-indigo-50 dark:bg-indigo-950/20">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              <span className="text-xs text-muted-foreground font-medium">Parcelas pagas</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{installmentStats.paidParcelas}<span className="text-base font-normal text-muted-foreground">/{installmentStats.totalParcelas}</span></p>
            <div className="mt-2 h-1.5 w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${installmentStats.totalParcelas > 0 ? Math.round((installmentStats.paidParcelas / installmentStats.totalParcelas) * 100) : 0}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{fmt(installmentStats.paidValue)} de {fmt(installmentStats.totalValue)}</p>
          </div>
        </Card>
        <Card className="bg-violet-50 dark:bg-violet-950/20">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Repeat2 className="h-4 w-4 text-violet-500" />
              <span className="text-xs text-muted-foreground font-medium">Mensalidades pagas</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{feeStats.paid}<span className="text-base font-normal text-muted-foreground">/{feeStats.total}</span></p>
            <div className="mt-2 h-1.5 w-full bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${feeStats.total > 0 ? Math.round((feeStats.paid / feeStats.total) * 100) : 0}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{fmt(feeStats.paidValue)} de {fmt(feeStats.totalValue)}</p>
          </div>
        </Card>
      </div>

      {/* Monthly totals */}
      <Card>
        <div className="p-4 pb-3 border-b">
          <h3 className="font-semibold text-sm">Pagamentos por mês</h3>
          <p className="text-xs text-muted-foreground">Total previsto × pago em cada mês</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left p-3 font-medium">Mês</th>
                <th className="text-right p-3 font-medium">Previsto</th>
                <th className="text-right p-3 font-medium">Pago</th>
                <th className="text-right p-3 font-medium">Restante</th>
                <th className="p-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {monthlyTotals.map((row) => {
                const remaining = row.scheduled - row.paid;
                const pct = row.scheduled > 0 ? Math.round((row.paid / row.scheduled) * 100) : 0;
                const isCurrentMonth = row.key === today.slice(0, 7);
                return (
                  <tr key={row.key} className={`border-b last:border-0 transition-colors ${isCurrentMonth ? "bg-blue-50/50 dark:bg-blue-950/10" : "hover:bg-muted/30"}`}>
                    <td className="p-3 font-medium">
                      {row.label}
                      {isCurrentMonth && <span className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">atual</span>}
                    </td>
                    <td className="p-3 text-right tabular-nums">{fmt(row.scheduled)}</td>
                    <td className="p-3 text-right tabular-nums text-green-600 dark:text-green-400">{row.paid > 0 ? fmt(row.paid) : "—"}</td>
                    <td className={`p-3 text-right tabular-nums font-medium ${remaining > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                      {remaining > 0 ? fmt(remaining) : "Quitado"}
                    </td>
                    <td className="p-3">
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximos vencimentos */}
        <Card>
          <div className="p-4 pb-3 border-b">
            <h3 className="font-semibold text-sm">Próximos vencimentos</h3>
            <p className="text-xs text-muted-foreground">Próximos 14 dias</p>
          </div>
          <div className="p-4 space-y-1">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum pendente nos próximos 14 dias.</p>}
            {upcoming.map((p) => {
              const v = vendorMap[p.vendorId];
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: v.color }} />
                    <span className="text-sm font-medium truncate">{v.name}</span>
                    <span className="text-xs text-muted-foreground hidden sm:block">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{fmtDate(p.date)}</span>
                    <span className="text-sm font-bold tabular-nums">{fmt(p.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Progresso por fornecedor */}
        <Card>
          <div className="p-4 pb-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm">Progresso das parcelas</h3>
            <span className="text-xs text-muted-foreground tabular-nums">{installmentStats.paidParcelas}/{installmentStats.totalParcelas} pagas</span>
          </div>
          <div className="p-4 space-y-4">
            {progress.map(({ vendor: v, paid, total, pct }) => (
              <div key={v.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: v.color }} />
                    <span className="font-medium text-sm">{v.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor(v.relationshipStatus)}`}>{statusIcon(v.relationshipStatus)} {statusLabel(v.relationshipStatus)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{paid}/{total}</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: v.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sem previsão */}
      <Card>
        <div className="p-4 pb-3 border-b"><h3 className="font-semibold text-sm">Fornecedores sem previsão de pagamento</h3></div>
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {vendors.filter((v) => v.paymentType === "sem-previsao").map((v) => (
              <div key={v.id} className="rounded-lg border p-3 space-y-1.5" style={{ borderLeftColor: v.color, borderLeftWidth: 3 }}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold truncate">{v.name}</span>
                  <span className={`text-[10px] px-1 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor(v.relationshipStatus)}`}>{statusIcon(v.relationshipStatus)}</span>
                </div>
                <p className="text-base font-bold tabular-nums" style={{ color: v.color }}>{fmtCompact(v.totalOwed)}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{fmt(v.totalOwed)}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
