"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { VENDORS } from "@/lib/data";
import type { Vendor } from "@/lib/types";

const OVERRIDES_KEY = "nm_vendor_overrides_v1";
const CUSTOM_KEY = "nm_custom_vendors_v1";

export type VendorOverride = Partial<Pick<Vendor, "name" | "color" | "notes" | "relationshipStatus" | "totalOwed" | "entrada" | "totalInstallments" | "monthlyFee" | "paymentType" | "acordoAtivo">>;
export type Overrides = Record<string, VendorOverride>;

function loadJSON<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function persistJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function useVendorOverrides() {
  const [overrides, setOverrides] = useState<Overrides>({});
  const [customVendors, setCustomVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    setOverrides(loadJSON(OVERRIDES_KEY, {}));
    setCustomVendors(loadJSON(CUSTOM_KEY, []));
  }, []);

  const updateVendor = useCallback((id: string, patch: VendorOverride) => {
    setOverrides((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), ...patch } };
      persistJSON(OVERRIDES_KEY, next);
      return next;
    });
  }, []);

  const resetVendor = useCallback((id: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      persistJSON(OVERRIDES_KEY, next);
      return next;
    });
  }, []);

  const addCustomVendor = useCallback((vendor: Omit<Vendor, "id">) => {
    const newVendor: Vendor = { ...vendor, id: `custom-${Date.now()}` };
    setCustomVendors((prev) => {
      const next = [...prev, newVendor];
      persistJSON(CUSTOM_KEY, next);
      return next;
    });
  }, []);

  const deleteCustomVendor = useCallback((id: string) => {
    setCustomVendors((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistJSON(CUSTOM_KEY, next);
      return next;
    });
  }, []);

  const updateCustomVendor = useCallback((id: string, patch: VendorOverride) => {
    setCustomVendors((prev) => {
      const next = prev.map((v) => v.id === id ? { ...v, ...patch } : v);
      persistJSON(CUSTOM_KEY, next);
      return next;
    });
  }, []);

  const mergedVendors = useMemo<Vendor[]>(() => [
    ...VENDORS.map((v) => ({ ...v, ...(overrides[v.id] ?? {}) })),
    ...customVendors,
  ], [overrides, customVendors]);

  return {
    overrides,
    customVendors,
    mergedVendors,
    updateVendor,
    resetVendor,
    addCustomVendor,
    deleteCustomVendor,
    updateCustomVendor,
  };
}
