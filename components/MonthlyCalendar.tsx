"use client";
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { VENDOR_MAP } from "@/lib/data";
import { fmt, fmtDate, isoYear, isoMonth, MONTH_NAMES } from "@/lib/utils";
import type { Payment } from "@/lib/types";

interface Props {
  payments: Payment[];
  paidIds: Set<string>;
  onToggle: (id: string) => void;
}

const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function firstDayOffset(y: number, m: number) {
  const dow = new Date(y, m - 1, 1).getDay(); // 0=Sun
  return (dow + 6) % 7; // 0=Mon
}

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function MonthlyCalendar({ payments, paidIds, onToggle }: Props) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5); // May
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map: Record<string, Payment[]> = {};
    for (const p of payments) {
      (map[p.date] ??= []).push(p);
    }
    return map;
  }, [payments]);

  const monthTotal = useMemo(() => {
    return payments
      .filter((p) => isoYear(p.date) === year && isoMonth(p.date) === month)
      .reduce((s, p) => s + p.amount, 0);
  }, [payments, year, month]);

  const byVendorMonth = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of payments) {
      if (isoYear(p.date) === year && isoMonth(p.date) === month) {
        map[p.vendorId] = (map[p.vendorId] ?? 0) + p.amount;
      }
    }
    return map;
  }, [payments, year, month]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
    setSelected(null);
  }

  const totalDays = daysInMonth(year, month);
  const offset = firstDayOffset(year, month);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const selectedPayments = selected ? (byDate[selected] ?? []) : [];
  const selectedTotal = selectedPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Calendar */}
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Nav */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="font-semibold text-sm">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEK_DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`pad-${i}`} />;
              const dateStr = ymd(year, month, day);
              const dayPayments = byDate[dateStr] ?? [];
              const hasPayments = dayPayments.length > 0;
              const isSelected = selected === dateStr;
              const allPaid = hasPayments && dayPayments.every((p) => paidIds.has(p.id));
              const vendorIds = [...new Set(dayPayments.map((p) => p.vendorId))];

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelected(isSelected ? null : dateStr)}
                  className={`
                    relative flex flex-col items-center justify-start p-1 rounded-lg min-h-[48px] sm:min-h-[56px] text-sm transition-all
                    ${isSelected ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1" : "hover:bg-muted"}
                    ${hasPayments && !isSelected ? "bg-muted/40" : ""}
                    ${allPaid && !isSelected ? "opacity-40" : ""}
                  `}
                >
                  <span className="font-medium text-xs">{day}</span>
                  {hasPayments && (
                    <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                      {vendorIds.slice(0, 3).map((vid) => (
                        <span
                          key={vid}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: isSelected ? "white" : VENDOR_MAP[vid]?.color,
                          }}
                        />
                      ))}
                      {vendorIds.length > 3 && (
                        <span
                          className={`text-[8px] ${
                            isSelected ? "text-primary-foreground" : "text-muted-foreground"
                          }`}
                        >
                          +{vendorIds.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Month summary */}
          {monthTotal > 0 && (
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Total do mês</span>
                <span>{fmt(monthTotal)}</span>
              </div>
              {Object.entries(byVendorMonth).map(([vid, amt]) => {
                const v = VENDOR_MAP[vid];
                return (
                  <div key={vid} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: v?.color }}
                      />
                      <span className="text-muted-foreground">{v?.name}</span>
                    </div>
                    <span className="tabular-nums">{fmt(amt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Side panel */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">
            {selected ? fmtDate(selected) : "Selecione uma data"}
          </h3>
          {selected && selectedTotal > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Total:{" "}
              <span className="font-semibold text-foreground">{fmt(selectedTotal)}</span>
            </p>
          )}
        </div>
        <div className="p-4">
          {!selected && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Clique em um dia para ver os pagamentos.
            </p>
          )}
          {selected && selectedPayments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sem pagamentos nesta data.
            </p>
          )}
          <div className="space-y-2">
            {selectedPayments.map((p) => {
              const v = VENDOR_MAP[p.vendorId];
              const paid = paidIds.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => onToggle(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    paid
                      ? "opacity-50 bg-muted/30 border-transparent"
                      : "hover:bg-muted/40 border-transparent hover:border-border"
                  }`}
                >
                  {paid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: v?.color }}
                      />
                      <span
                        className={`text-sm font-medium ${
                          paid ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {v?.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.label}</p>
                  </div>
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
      </div>
    </div>
  );
}
