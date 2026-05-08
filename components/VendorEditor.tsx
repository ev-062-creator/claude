"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronUp, Download, RotateCcw, Save, Calculator, Plus, Trash2, X } from "lucide-react";
import { VENDORS } from "@/lib/data";
import { fmt, statusLabel, statusColor, statusIcon, exportCSV } from "@/lib/utils";
import type { RelationshipStatus, PaymentType, Vendor } from "@/lib/types";
import type { VendorOverride } from "@/hooks/useVendorOverrides";

interface Props {
  vendors: Vendor[];
  overrides: Record<string, VendorOverride>;
  customVendorIds: string[];
  onUpdate: (id: string, patch: VendorOverride) => void;
  onReset: (id: string) => void;
  onAdd: (vendor: Omit<Vendor, "id">) => void;
  onDelete: (id: string) => void;
  onUpdateCustom: (id: string, patch: VendorOverride) => void;
}

const STATUS_OPTIONS: { value: RelationshipStatus; label: string }[] = [
  { value: "ativo", label: "🟢 Ativo" },
  { value: "romper", label: "🔴 Romper" },
  { value: "sem-servico", label: "⚫ Sem serviço" },
  { value: "a-negociar", label: "🟡 A negociar" },
];

const TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "sem-previsao", label: "Sem previsão" },
];

const PRESET_COLORS = [
  "#F97316", "#3B82F6", "#16A34A", "#CA8A04", "#7C3AED",
  "#6B7280", "#DC2626", "#4F46E5", "#0891B2", "#DB2777",
  "#059669", "#D97706", "#9333EA", "#0EA5E9", "#EF4444",
];

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {sub && <span className="text-[10px] text-muted-foreground/60">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function CalcField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <Calculator className="h-3 w-3 text-muted-foreground/50" />
      </div>
      <div className="w-full px-2.5 py-1.5 rounded-md border text-sm tabular-nums font-semibold bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-300">
        {value}
      </div>
    </div>
  );
}

function inputCls() {
  return "w-full px-2.5 py-1.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
}

// ── Shared form fields (used in both edit and new forms) ──────────────────────

interface DraftState {
  name: string;
  color: string;
  relationshipStatus: RelationshipStatus;
  paymentType: PaymentType;
  totalOwed: number | "";
  entrada: number | "";
  totalInstallments: number | "";
  monthlyFee: number | "";
  notes: string;
}

function emptyDraft(): DraftState {
  return { name: "", color: PRESET_COLORS[0], relationshipStatus: "ativo", paymentType: "mensal", totalOwed: "", entrada: "", totalInstallments: "", monthlyFee: "", notes: "" };
}

function calcInstallment(draft: DraftState): number | null {
  const total = Number(draft.totalOwed);
  const entrada = Number(draft.entrada ?? 0);
  const n = Number(draft.totalInstallments);
  if (!n || !total) return null;
  return (total - entrada) / n;
}

function AgreementForm({
  initial, showColor = false, onSave, onCancel, saveLabel = "Salvar",
}: {
  initial: DraftState;
  showColor?: boolean;
  onSave: (d: DraftState) => void;
  onCancel: () => void;
  saveLabel?: string;
}) {
  const [draft, setDraft] = useState<DraftState>(initial);
  const installmentVal = calcInstallment(draft);

  function set<K extends keyof DraftState>(k: K, v: DraftState[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onSave(draft);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row 1: name + color + status + type */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nome do fornecedor">
          <input
            required
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ex: Fornecedor XYZ"
            className={inputCls()}
          />
        </Field>

        {showColor && (
          <Field label="Cor identificadora">
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${draft.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>
        )}

        <Field label="Status do relacionamento">
          <select value={draft.relationshipStatus} onChange={(e) => set("relationshipStatus", e.target.value as RelationshipStatus)} className={inputCls()}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>

        <Field label="Tipo de pagamento">
          <select value={draft.paymentType} onChange={(e) => set("paymentType", e.target.value as PaymentType)} className={inputCls()}>
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      {/* Row 2: financial fields */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Total devido (R$)">
          <input
            type="number" step="0.01" min="0"
            value={draft.totalOwed}
            onChange={(e) => set("totalOwed", parseFloat(e.target.value) || "")}
            placeholder="0,00"
            className={inputCls()}
          />
        </Field>

        <Field label="Entrada (R$)" sub="opcional">
          <input
            type="number" step="0.01" min="0"
            value={draft.entrada}
            onChange={(e) => set("entrada", parseFloat(e.target.value) || "")}
            placeholder="0,00"
            className={inputCls()}
          />
        </Field>

        <Field label="Qtd. de parcelas">
          <input
            type="number" step="1" min="0"
            value={draft.totalInstallments}
            onChange={(e) => set("totalInstallments", parseInt(e.target.value) || "")}
            placeholder="—"
            className={inputCls()}
          />
        </Field>

        <CalcField
          label="Valor por parcela"
          value={installmentVal !== null && installmentVal > 0 ? fmt(installmentVal) : "Preencha os campos"}
        />
      </div>

      {/* Row 3: monthly fee + notes */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Mensalidade corrente (R$)" sub="opcional">
          <input
            type="number" step="0.01" min="0"
            value={draft.monthlyFee}
            onChange={(e) => set("monthlyFee", parseFloat(e.target.value) || "")}
            placeholder="Sem mensalidade"
            className={inputCls()}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notas / observações">
            <input
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Condições negociadas, prazos, contatos..."
              className={inputCls()}
            />
          </Field>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Save className="h-3.5 w-3.5" /> {saveLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg border text-sm hover:bg-muted transition-colors ml-auto">
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Existing vendor card (accordion) ─────────────────────────────────────────

function VendorCard({
  vendor, override, isCustom, onUpdate, onReset, onDelete,
}: {
  vendor: Vendor;
  override: VendorOverride | undefined;
  isCustom: boolean;
  onUpdate: (patch: VendorOverride) => void;
  onReset: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const hasOverride = !isCustom && !!override && Object.keys(override).length > 0;
  const effective = { ...vendor, ...(override ?? {}) };

  const initialDraft = (): DraftState => ({
    name: effective.name,
    color: effective.color,
    relationshipStatus: effective.relationshipStatus,
    paymentType: effective.paymentType,
    totalOwed: effective.totalOwed,
    entrada: effective.entrada ?? "",
    totalInstallments: effective.totalInstallments ?? "",
    monthlyFee: effective.monthlyFee ?? "",
    notes: effective.notes ?? "",
  });

  function handleSave(d: DraftState) {
    const patch: VendorOverride = {};
    if (d.name !== vendor.name) patch.name = d.name;
    if (d.color !== vendor.color) patch.color = d.color;
    if (d.relationshipStatus !== vendor.relationshipStatus) patch.relationshipStatus = d.relationshipStatus;
    if (d.paymentType !== vendor.paymentType) patch.paymentType = d.paymentType;
    if (Number(d.totalOwed) !== vendor.totalOwed) patch.totalOwed = Number(d.totalOwed) || 0;
    if (Number(d.entrada || 0) !== (vendor.entrada ?? 0)) patch.entrada = Number(d.entrada) || undefined;
    if (Number(d.totalInstallments || 0) !== (vendor.totalInstallments ?? 0)) patch.totalInstallments = Number(d.totalInstallments) || undefined;
    if (Number(d.monthlyFee || 0) !== (vendor.monthlyFee ?? 0)) patch.monthlyFee = Number(d.monthlyFee) || undefined;
    if ((d.notes ?? "") !== (vendor.notes ?? "")) patch.notes = d.notes;
    onUpdate(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setOpen(false);
  }

  return (
    <div className={`rounded-xl border bg-card shadow-sm overflow-hidden transition-all ${open ? "ring-2 ring-primary/30" : ""} ${isCustom ? "border-l-4" : ""}`} style={isCustom ? { borderLeftColor: vendor.color } : {}}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: effective.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{effective.name}</span>
            {isCustom && <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">novo</span>}
            {hasOverride && <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium">editado</span>}
            {saved && <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">salvo ✓</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor(effective.relationshipStatus)}`}>
              {statusIcon(effective.relationshipStatus)} {statusLabel(effective.relationshipStatus)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{fmt(effective.totalOwed)}</span>
            {effective.totalInstallments && <span className="text-xs text-muted-foreground">{effective.totalInstallments}x</span>}
            <span className="text-xs text-muted-foreground">
              {effective.paymentType === "sem-previsao" ? "Sem previsão" : effective.paymentType === "semanal" ? "Semanal" : "Mensal"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isCustom && onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); if (confirm(`Excluir "${effective.name}"?`)) onDelete(); }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              title="Excluir fornecedor"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3 bg-muted/10 space-y-3">
          <AgreementForm
            initial={initialDraft()}
            showColor={isCustom}
            onSave={handleSave}
            onCancel={() => setOpen(false)}
            saveLabel="Salvar alterações"
          />
          {hasOverride && (
            <button
              onClick={() => { onReset(); setOpen(false); }}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Restaurar dados originais
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── New agreement form panel ──────────────────────────────────────────────────

function NewAgreementPanel({ onAdd }: { onAdd: Props["onAdd"] }) {
  const [open, setOpen] = useState(false);

  function handleSave(d: DraftState) {
    const entrada = Number(d.entrada) || 0;
    const totalInstallments = Number(d.totalInstallments) || undefined;
    const monthlyFee = Number(d.monthlyFee) || undefined;
    onAdd({
      name: d.name.trim(),
      color: d.color,
      bg: d.color + "20",
      relationshipStatus: d.relationshipStatus,
      paymentType: d.paymentType,
      totalOwed: Number(d.totalOwed) || 0,
      entrada: entrada || undefined,
      totalInstallments,
      monthlyFee,
      notes: d.notes.trim() || undefined,
    });
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-primary/30 text-sm font-medium text-primary hover:bg-primary/5 hover:border-primary/50 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Novo acordo / fornecedor
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Novo acordo</span>
        </div>
        <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-4 py-4">
        <AgreementForm
          initial={emptyDraft()}
          showColor
          onSave={handleSave}
          onCancel={() => setOpen(false)}
          saveLabel="Criar acordo"
        />
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function VendorEditor({ vendors, overrides, customVendorIds, onUpdate, onReset, onAdd, onDelete, onUpdateCustom }: Props) {
  function handleExportCSV() {
    const rows = vendors.map((v) => {
      const entrada = v.entrada ?? 0;
      const parcelas = v.totalInstallments ?? 0;
      const valorParcela = parcelas > 0 ? (v.totalOwed - entrada) / parcelas : 0;
      return {
        ID: v.id,
        Nome: v.name,
        Status: statusLabel(v.relationshipStatus),
        "Tipo pagamento": v.paymentType,
        "Total devido": v.totalOwed.toFixed(2).replace(".", ","),
        Entrada: entrada > 0 ? entrada.toFixed(2).replace(".", ",") : "",
        "N° parcelas": parcelas || "",
        "Valor parcela": valorParcela > 0 ? valorParcela.toFixed(2).replace(".", ",") : "",
        Mensalidade: v.monthlyFee ? v.monthlyFee.toFixed(2).replace(".", ",") : "",
        Notas: v.notes ?? "",
      };
    });
    exportCSV(rows, "fornecedores_novo_mundo.csv");
  }

  const baseVendors = vendors.filter((v) => !customVendorIds.includes(v.id));
  const customVendors = vendors.filter((v) => customVendorIds.includes(v.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Editor de Fornecedores</h2>
          <p className="text-xs text-muted-foreground">Clique em um fornecedor para editar. Alterações refletem em todo o dashboard.</p>
        </div>
        <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium hover:bg-muted transition-colors">
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </button>
      </div>

      {/* New agreement button/form */}
      <NewAgreementPanel onAdd={onAdd} />

      {/* Custom vendors (added by user) */}
      {customVendors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground px-0.5">Acordos adicionados</p>
          {customVendors.map((v) => (
            <VendorCard
              key={v.id}
              vendor={v}
              override={undefined}
              isCustom
              onUpdate={(patch) => onUpdateCustom(v.id, patch)}
              onReset={() => {}}
              onDelete={() => onDelete(v.id)}
            />
          ))}
        </div>
      )}

      {/* Base vendors */}
      <div className="space-y-2">
        {customVendors.length > 0 && <p className="text-xs font-medium text-muted-foreground px-0.5">Fornecedores base</p>}
        {baseVendors.map((v) => (
          <VendorCard
            key={v.id}
            vendor={VENDORS.find((base) => base.id === v.id) ?? v}
            override={overrides[v.id]}
            isCustom={false}
            onUpdate={(patch) => onUpdate(v.id, patch)}
            onReset={() => onReset(v.id)}
          />
        ))}
      </div>
    </div>
  );
}
