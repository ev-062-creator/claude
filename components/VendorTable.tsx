"use client";
import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Circle, CheckCheck, AlertTriangle, Clock, CalendarClock } from "lucide-react";
import { fmt, fmtCompact, statusLabel, statusIcon, statusColor, todayISO } from "@/lib/utils";
import type { Payment, PaymentType, RelationshipStatus, Vendor } from "@/lib/types";

interface Props {
  payments: Payment[];
  paidIds: Set<string>;
  onToggle: (id: string) => void;
  vendors: Vendor[];
}

const TYPE_LABELS: Record<PaymentType, string> = {
  semanal: "Semanal",
  mensal: "Mensal",
  "sem-previsao": "Sem previsão",
};

function InstallmentRow({ p, paid, onToggle }: { p: Payment; paid: boolean; onToggle: () => void }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2 border-b last:border-0 transition-colors ${paid ? "bg-green-50/40 dark:bg-green-950/10" : "hover:bg-muted/20"}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <button onClick={onToggle} className="flex-shrink-0 text-muted-foreground hover:text-green-600 transition-colors">
          {paid ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4" />}
        </button>
        <span className={`text-sm truncate ${paid ? "line-through text-muted-foreground" : "font-medium"}`}>{p.label}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-muted-foreground">{p.date.split("-").reverse().join("/")}</span>
        <span className={`text-sm tabular-nums font-semibold ${paid ? "text-green-600 dark:text-green-400" : ""}`}>{fmt(p.amount)}</span>
      </div>
    </div>
  );
}

function VendorCard({ vendor, installments, paidIds, onToggle }: {
  vendor: Vendor;
  installments: Payment[];
  paidIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const hasInstallments = installments.length > 0;
  const paidCount = installments.filter((p) => paidIds.has(p.id)).length;
  const total = installments.length;
  const pct = total > 0 ? Math.round((paidCount / total) * 100) : 0;
  const paidAmt = installments.filter((p) => paidIds.has(p.id)).reduce((s, p) => s + p.amount, 0);
  const allDone = total > 0 && paidCount === total;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col" style={{ borderTopColor: vendor.color, borderTopWidth: 3 }}>
      {/* Card header */}
      <div className="p-4 pb-3 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: vendor.color }}>
              {vendor.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{vendor.name}</p>
              <p className="text-xs text-muted-foreground">{TYPE_LABELS[vendor.paymentType]}</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor(vendor.relationshipStatus)}`}>
            {statusIcon(vendor.relationshipStatus)} {statusLabel(vendor.relationshipStatus)}
          </span>
        </div>

        {/* Total */}
        <div className="mb-3">
          <p className="text-xl font-bold tabular-nums" style={{ color: vendor.color }}>{fmt(vendor.totalOwed)}</p>
          <p className="text-xs text-muted-foreground">Total acordado</p>
        </div>

        {/* Progress bar (installment vendors only) */}
        {hasInstallments && (
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{paidCount} de {total} parcelas pagas</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: vendor.color }} />
            </div>
            {paidAmt > 0 && (
              <p className="text-xs text-muted-foreground">
                Pago: {fmtCompact(paidAmt)} · Restante: {fmtCompact(vendor.totalOwed - paidAmt)}
              </p>
            )}
          </div>
        )}

        {/* Monthly fee */}
        {vendor.monthlyFee && (
          <div className="flex justify-between text-xs py-1.5 border-t">
            <span className="text-muted-foreground">{vendor.paymentType === "sem-previsao" ? "Custo médio/mês" : "Mensalidade atual"}</span>
            <span className="font-medium">{fmt(vendor.monthlyFee)}</span>
          </div>
        )}

        {/* Notes */}
        {vendor.notes && (
          <p className="text-xs text-muted-foreground leading-snug border-t pt-2 mt-2">{vendor.notes}</p>
        )}
      </div>

      {/* Expand toggle (installment vendors only) */}
      {hasInstallments && (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-between px-4 py-2.5 border-t text-xs font-medium hover:bg-muted/30 transition-colors w-full text-left"
          >
            <span className="text-muted-foreground">{open ? "Ocultar parcelas" : "Ver parcelas"}</span>
            <div className="flex items-center gap-2">
              {allDone && <span className="text-green-600 dark:text-green-400 font-semibold">Quitado ✓</span>}
              {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </button>

          {open && (
            <div className="border-t">
              <div className="divide-y max-h-64 overflow-y-auto">
                {installments.map((p) => (
                  <InstallmentRow key={p.id} p={p} paid={paidIds.has(p.id)} onToggle={() => onToggle(p.id)} />
                ))}
              </div>
              {!allDone && (
                <div className="px-4 py-2 border-t bg-muted/10 flex justify-end">
                  <button
                    onClick={() => installments.filter((p) => !paidIds.has(p.id)).forEach((p) => onToggle(p.id))}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como pagas
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function VendorTable({ payments, paidIds, onToggle, vendors }: Props) {
  const today = todayISO();
  const [filterType, setFilterType] = useState<PaymentType | "todos">("todos");
  const [filterStatus, setFilterStatus] = useState<RelationshipStatus | "todos">("todos");

  const filtered = useMemo(
    () => vendors
      .filter((v) => filterType === "todos" || v.paymentType === filterType)
      .filter((v) => filterStatus === "todos" || v.relationshipStatus === filterStatus),
    [vendors, filterType, filterStatus]
  );

  const byVendor = useMemo(() => {
    const map: Record<string, Payment[]> = {};
    for (const v of vendors) map[v.id] = [];
    for (const p of payments) {
      if (map[p.vendorId] !== undefined && !p.isMonthlyFee) map[p.vendorId].push(p);
    }
    for (const id of Object.keys(map)) map[id].sort((a, b) => a.date.localeCompare(b.date));
    return map;
  }, [payments, vendors]);

  const totals = useMemo(() => {
    const comAcordo = vendors.filter((v) => v.paymentType !== "sem-previsao").reduce((s, v) => s + v.totalOwed, 0);
    const semPrevisao = vendors.filter((v) => v.paymentType === "sem-previsao").reduce((s, v) => s + v.totalOwed, 0);
    return { comAcordo, semPrevisao, total: comAcordo + semPrevisao };
  }, [vendors]);

  // Status buckets
  const statusBuckets = useMemo(() => {
    const unpaid = payments.filter((p) => !paidIds.has(p.id));
    const atrasado = unpaid.filter((p) => p.date < today);
    const aberto   = unpaid.filter((p) => p.date === today);
    const futura   = unpaid.filter((p) => p.date > today);
    const sum = (arr: Payment[]) => arr.reduce((s, p) => s + p.amount, 0);
    return {
      atrasado: { count: atrasado.length, value: sum(atrasado) },
      aberto:   { count: aberto.length,   value: sum(aberto) },
      futura:   { count: futura.length,   value: sum(futura) },
    };
  }, [payments, paidIds, today]);

  // Aggregate installment stats
  const installStats = useMemo(() => {
    let paid = 0, total = 0;
    for (const v of vendors.filter((v) => v.totalInstallments)) {
      const ps = byVendor[v.id] ?? [];
      total += ps.length;
      paid += ps.filter((p) => paidIds.has(p.id)).length;
    }
    return { paid, total };
  }, [vendors, byVendor, paidIds]);

  return (
    <div className="space-y-4">
      {/* Status summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground">Em atraso</span>
          </div>
          <p className="text-xl font-bold tabular-nums text-red-600 dark:text-red-400">{fmtCompact(statusBuckets.atrasado.value)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{statusBuckets.atrasado.count} pagamento{statusBuckets.atrasado.count !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">Em aberto hoje</span>
          </div>
          <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{fmtCompact(statusBuckets.aberto.value)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{statusBuckets.aberto.count} pagamento{statusBuckets.aberto.count !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-xl border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-muted-foreground">Futuros</span>
          </div>
          <p className="text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{fmtCompact(statusBuckets.futura.value)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{statusBuckets.futura.count} pagamento{statusBuckets.futura.count !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Aggregate installments banner */}
      {installStats.total > 0 && (
        <div className="rounded-xl border bg-card shadow-sm px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="font-medium">Progresso geral das parcelas</span>
              <span className="tabular-nums">{installStats.paid}/{installStats.total} pagas</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.round((installStats.paid / installStats.total) * 100)}%` }} />
            </div>
          </div>
          <span className="text-lg font-bold tabular-nums flex-shrink-0">
            {Math.round((installStats.paid / installStats.total) * 100)}%
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as PaymentType | "todos")}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="todos">Todos os tipos</option>
          <option value="semanal">Semanal</option>
          <option value="mensal">Mensal</option>
          <option value="sem-previsao">Sem previsão</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as RelationshipStatus | "todos")}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="todos">Todos os status</option>
          <option value="ativo">🟢 Ativo</option>
          <option value="romper">🔴 Romper</option>
          <option value="sem-servico">⚫ Sem serviço</option>
          <option value="a-negociar">🟡 A negociar</option>
        </select>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((v) => (
          <VendorCard
            key={v.id}
            vendor={v}
            installments={byVendor[v.id] ?? []}
            paidIds={paidIds}
            onToggle={onToggle}
          />
        ))}
      </div>

      {/* Summary footer */}
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total com acordo</p>
            <p className="font-bold">{fmt(totals.comAcordo)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Sem previsão</p>
            <p className="font-bold text-amber-600 dark:text-amber-400">{fmt(totals.semPrevisao)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total geral</p>
            <p className="font-bold text-red-600 dark:text-red-400">{fmt(totals.total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
