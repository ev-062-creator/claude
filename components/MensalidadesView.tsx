"use client";
import React, { useMemo, useState } from "react";
import { CheckCircle2, Circle, Repeat2, Info, Plus, X, Trash2 } from "lucide-react";
import { fmt, fmtDate, statusLabel, statusColor, statusIcon } from "@/lib/utils";
import type { Payment, Vendor } from "@/lib/types";

interface Props {
  payments: Payment[];
  paidIds: Set<string>;
  onToggle: (id: string) => void;
  vendors: Vendor[];
  customFeeIds: string[];
  onAddFee: (fee: Omit<Payment, "id">) => void;
  onDeleteFee: (id: string) => void;
}

function ToggleRow({
  p, paid, onToggle, isCustom, onDelete,
}: {
  p: Payment; paid: boolean; onToggle: () => void; isCustom: boolean; onDelete?: () => void;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b last:border-0 transition-colors group ${paid ? "bg-green-50/40 dark:bg-green-950/10" : "hover:bg-muted/20"}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <button onClick={onToggle} className="flex-shrink-0 text-muted-foreground hover:text-green-600 transition-colors">
          {paid ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4" />}
        </button>
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${paid ? "line-through text-muted-foreground" : ""}`}>{p.label}</p>
          <p className="text-xs text-muted-foreground">{fmtDate(p.date)}</p>
        </div>
        {isCustom && <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full flex-shrink-0">adicionado</span>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-sm tabular-nums font-semibold ${paid ? "text-green-600 dark:text-green-400" : ""}`}>{fmt(p.amount)}</span>
        {isCustom && onDelete && (
          <button
            onClick={() => { if (confirm(`Excluir "${p.label}"?`)) onDelete(); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-500 transition-all"
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── New fee form ──────────────────────────────────────────────────────────────

function NewFeeForm({ vendors, onAdd, onClose }: {
  vendors: Vendor[];
  onAdd: (fee: Omit<Payment, "id">) => void;
  onClose: () => void;
}) {
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId || !label.trim() || !amount || !date) return;
    onAdd({
      vendorId,
      label: label.trim(),
      amount: parseFloat(amount),
      date,
      frequency: "mensalidade",
      isMonthlyFee: true,
    });
    setLabel(""); setAmount(""); setDate("");
    onClose();
  }

  const inputCls = "w-full px-2.5 py-1.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-4 pt-3 space-y-3 bg-muted/10 border-t">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Vendor */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Fornecedor</label>
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={inputCls} required>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        {/* Label */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Descrição</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Mensalidade Jun/26"
            className={inputCls}
            required
          />
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className={inputCls}
            required
          />
        </div>

        {/* Date */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Data de vencimento</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
            required
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar mensalidade
        </button>
        <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border text-sm hover:bg-muted transition-colors ml-auto">
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MensalidadesView({ payments, paidIds, onToggle, vendors, customFeeIds, onAddFee, onDeleteFee }: Props) {
  const [showForm, setShowForm] = useState(false);

  const feePayments = useMemo(
    () => payments.filter((p) => p.isMonthlyFee).sort((a, b) => a.date.localeCompare(b.date)),
    [payments]
  );

  const byVendor = useMemo(() => {
    const map: Record<string, Payment[]> = {};
    for (const p of feePayments) (map[p.vendorId] ??= []).push(p);
    return map;
  }, [feePayments]);

  const contractFees = useMemo(
    () => vendors.filter((v) => v.monthlyFee && !byVendor[v.id]),
    [vendors, byVendor]
  );

  const vendorMap = useMemo(
    () => Object.fromEntries(vendors.map((v) => [v.id, v])),
    [vendors]
  );

  const totalScheduled = feePayments.reduce((s, p) => s + p.amount, 0);
  const totalPaid = feePayments.filter((p) => paidIds.has(p.id)).reduce((s, p) => s + p.amount, 0);
  const totalPending = totalScheduled - totalPaid;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Repeat2 className="h-4 w-4 text-violet-500" />
          <h2 className="font-semibold text-sm">Resumo das Mensalidades</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground">Total previsto</p>
            <p className="text-sm font-bold tabular-nums mt-0.5">{fmt(totalScheduled)}</p>
            <p className="text-[10px] text-muted-foreground">{feePayments.length} mensalidades</p>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3">
            <p className="text-[10px] text-muted-foreground">Pago</p>
            <p className="text-sm font-bold tabular-nums text-green-600 dark:text-green-400 mt-0.5">{fmt(totalPaid)}</p>
            <p className="text-[10px] text-muted-foreground">{feePayments.filter((p) => paidIds.has(p.id)).length} pagas</p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-[10px] text-muted-foreground">Pendente</p>
            <p className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">{fmt(totalPending)}</p>
            <p className="text-[10px] text-muted-foreground">{feePayments.filter((p) => !paidIds.has(p.id)).length} pendentes</p>
          </div>
        </div>
      </div>

      {/* Scheduled fees grouped by vendor */}
      {Object.keys(byVendor).length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm px-0.5">Mensalidades agendadas</h3>
          {Object.entries(byVendor).map(([vendorId, ps]) => {
            const v = vendorMap[vendorId];
            if (!v) return null;
            const vPaid = ps.filter((p) => paidIds.has(p.id)).length;
            const vPaidVal = ps.filter((p) => paidIds.has(p.id)).reduce((s, p) => s + p.amount, 0);
            const vTotal = ps.reduce((s, p) => s + p.amount, 0);
            return (
              <div key={vendorId} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: v.color }} />
                    <span className="font-semibold text-sm">{v.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor(v.relationshipStatus)}`}>
                      {statusIcon(v.relationshipStatus)} {statusLabel(v.relationshipStatus)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground tabular-nums">{vPaid}/{ps.length} pagas</p>
                    <p className="text-xs font-semibold tabular-nums text-green-600 dark:text-green-400">{fmt(vPaidVal)} de {fmt(vTotal)}</p>
                  </div>
                </div>
                <div className="divide-y">
                  {ps.map((p) => (
                    <ToggleRow
                      key={p.id}
                      p={p}
                      paid={paidIds.has(p.id)}
                      onToggle={() => onToggle(p.id)}
                      isCustom={customFeeIds.includes(p.id)}
                      onDelete={() => onDeleteFee(p.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new fee */}
      <div className="rounded-xl border-2 bg-card shadow-sm overflow-hidden" style={{ borderColor: showForm ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))", borderStyle: showForm ? "solid" : "dashed" }}>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nova mensalidade
          </button>
        ) : (
          <>
            <div className="px-4 py-3 border-b bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Nova mensalidade</span>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <NewFeeForm vendors={vendors} onAdd={onAddFee} onClose={() => setShowForm(false)} />
          </>
        )}
      </div>

      {/* Contract monthly fees (informational) */}
      {contractFees.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-0.5">
            <h3 className="font-semibold text-sm">Mensalidades de contrato</h3>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">valores correntes sem parcelas agendadas</span>
          </div>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground bg-muted/20">
                  <th className="text-left p-3 font-medium">Fornecedor</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Mensalidade/mês</th>
                  <th className="text-left p-3 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {contractFees.map((v) => (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: v.color }} />
                        <span className="font-medium">{v.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor(v.relationshipStatus)}`}>
                        {statusIcon(v.relationshipStatus)} {statusLabel(v.relationshipStatus)}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums font-semibold">{fmt(v.monthlyFee!)}</td>
                    <td className="p-3 text-xs text-muted-foreground">{v.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
