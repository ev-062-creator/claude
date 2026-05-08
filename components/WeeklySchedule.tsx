"use client";
import React, { useMemo, useState } from "react";
import { ChevronDown, CheckCircle2, Circle, Download, AlertTriangle } from "lucide-react";
import { buildWeeks, VENDOR_MAP, VENDORS } from "@/lib/data";
import { fmt, fmtDate, fmtDateShort, monthShort, exportCSV } from "@/lib/utils";
import type { Payment } from "@/lib/types";

const HIGH = 35000;

interface Props {
  payments: Payment[];
  paidIds: Set<string>;
  onToggle: (id: string) => void;
}

export default function WeeklySchedule({ payments, paidIds, onToggle }: Props) {
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]));
  const [filterVendor, setFilterVendor] = useState("todos");

  const filtered = useMemo(
    () => (filterVendor === "todos" ? payments : payments.filter((p) => p.vendorId === filterVendor)),
    [payments, filterVendor]
  );
  const weeks = useMemo(() => buildWeeks(filtered), [filtered]);

  function toggleWeek(n: number) {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  }

  function handleExport() {
    const rows = weeks.flatMap((w) =>
      w.days.flatMap((d) =>
        d.payments.map((p) => ({
          Semana: `Semana ${w.weekNumber}`,
          "Início": fmtDate(w.startDate),
          "Fim": fmtDate(w.endDate),
          Dia: d.label,
          Data: fmtDate(d.date),
          Fornecedor: VENDOR_MAP[p.vendorId].name,
          Parcela: p.label,
          Valor: p.amount.toFixed(2).replace(".", ","),
          Pago: paidIds.has(p.id) ? "Sim" : "Não",
        }))
      )
    );
    exportCSV(rows, "cronograma_novo_mundo.csv");
  }

  // Vendors that appear in the schedule (have payments in any week)
  const scheduleVendors = VENDORS.filter(
    (v) => v.paymentType === "semanal" || v.paymentType === "mensal"
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <select
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="todos">Todos os fornecedores</option>
          {scheduleVendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* Weeks */}
      <div className="space-y-2">
        {weeks.map((w) => {
          const isOpen = openWeeks.has(w.weekNumber);
          const isHigh = w.total > HIGH;
          const paidAmt = w.days
            .flatMap((d) => d.payments)
            .filter((p) => paidIds.has(p.id))
            .reduce((s, p) => s + p.amount, 0);
          const pending = w.total - paidAmt;
          const hasPayments = w.total > 0;

          return (
            <div
              key={w.weekNumber}
              className={`rounded-xl border shadow-sm overflow-hidden ${
                isHigh ? "border-red-300 dark:border-red-800" : ""
              }`}
            >
              {/* Week header */}
              <button
                onClick={() => toggleWeek(w.weekNumber)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${
                  isHigh ? "bg-red-50/60 dark:bg-red-950/20" : "bg-card"
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isHigh && (
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className="font-semibold text-sm">
                    Semana {w.weekNumber}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {fmtDateShort(w.startDate)} – {fmtDateShort(w.endDate)}
                  </span>
                  <span className="text-xs text-muted-foreground sm:hidden">
                    {monthShort(w.startDate)}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {paidAmt > 0 && (
                    <span className="text-xs text-green-600 font-medium hidden sm:block">
                      pago {fmt(paidAmt)}
                    </span>
                  )}
                  {hasPayments ? (
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isHigh ? "text-red-600 dark:text-red-400" : ""
                      }`}
                    >
                      {fmt(w.total)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem pagamentos</span>
                  )}
                  {pending < w.total && pending > 0 && (
                    <span className="text-xs text-muted-foreground hidden md:block">
                      restam {fmt(pending)}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Week detail */}
              {isOpen && (
                <div className="border-t bg-card">
                  {w.days.filter((d) => d.payments.length > 0).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum pagamento nesta semana.
                    </p>
                  ) : (
                    <div className="p-4 space-y-4">
                      {w.days
                        .filter((d) => d.payments.length > 0)
                        .map((d) => (
                          <div key={d.date}>
                            {/* Day header */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-8">
                                {d.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {fmtDate(d.date)}
                              </span>
                              <div className="flex-1 h-px bg-border" />
                              <span className="text-xs font-semibold tabular-nums">
                                {fmt(d.total)}
                              </span>
                            </div>

                            {/* Payments */}
                            <div className="space-y-1.5 pl-10">
                              {d.payments.map((p) => {
                                const v = VENDOR_MAP[p.vendorId];
                                const paid = paidIds.has(p.id);
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => onToggle(p.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all border ${
                                      paid
                                        ? "opacity-50 bg-muted/30 border-transparent"
                                        : "border-transparent hover:border-border hover:bg-muted/40"
                                    }`}
                                  >
                                    {paid ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{ background: v.color }}
                                    />
                                    <span
                                      className={`text-sm font-medium flex-1 min-w-0 truncate ${
                                        paid ? "line-through text-muted-foreground" : ""
                                      }`}
                                    >
                                      {v.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                      {p.label}
                                    </span>
                                    <span
                                      className={`text-sm font-bold tabular-nums flex-shrink-0 ${
                                        paid ? "text-muted-foreground" : ""
                                      }`}
                                    >
                                      {fmt(p.amount)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
