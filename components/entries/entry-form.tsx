"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { updateEntryAction } from "@/app/(app)/products/[id]/actions";
import type { EntryRow } from "@/lib/db/entries";
import type { MonthRow } from "@/lib/db/months";
import type { ProductRow } from "@/lib/db/products";
import {
  entrySchema,
  type EntryField,
  type EntryValues,
} from "@/lib/validators/entry";
import { Form } from "@/components/ui/form";
import { CostsSection } from "@/components/entries/costs-section";
import {
  SaveIndicator,
  type SaveState,
} from "@/components/entries/save-indicator";
import { SalesSection } from "@/components/entries/sales-section";
import { StockSection } from "@/components/entries/stock-section";
import { KpiGrid } from "@/components/kpi/kpi-grid";

const DEBOUNCE_MS = 800;

function toFormValues(entry: EntryRow | null): EntryValues {
  if (!entry) {
    return {
      leads: 0,
      orders: 0,
      delivered: 0,
      revenue_cents: 0,
      ads_spend_cents: 0,
      test_spend_cents: 0,
      ad_account_cents: 0,
      product_cost_cents: 0,
      service_cost_cents: 0,
      bonus_cents: 0,
      initial_stock: null,
      current_stock: null,
    };
  }
  return {
    leads: entry.leads,
    orders: entry.orders,
    delivered: entry.delivered,
    revenue_cents: entry.revenue_cents,
    ads_spend_cents: entry.ads_spend_cents,
    test_spend_cents: entry.test_spend_cents,
    ad_account_cents: entry.ad_account_cents,
    product_cost_cents: entry.product_cost_cents,
    service_cost_cents: entry.service_cost_cents,
    bonus_cents: entry.bonus_cents,
    initial_stock: entry.initial_stock,
    current_stock: entry.current_stock,
  };
}

export function EntryForm({
  entry,
  month,
  product,
  daysElapsed,
}: {
  entry: EntryRow | null;
  month: MonthRow;
  product: ProductRow;
  daysElapsed: number | null;
}) {
  const initial = toFormValues(entry);

  const form = useForm<EntryValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: initial,
    mode: "onChange",
  });

  const lastSaved = useRef<EntryValues>(initial);
  const timers = useRef<Map<EntryField, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const pending = useRef<Set<EntryField>>(new Set());
  const inFlight = useRef<Set<EntryField>>(new Set());
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  const settleIndicator = useCallback(() => {
    if (
      pending.current.size === 0 &&
      timers.current.size === 0 &&
      inFlight.current.size === 0
    ) {
      // Only set "saved" if anything has actually been saved this session.
      // Otherwise stay idle (no misleading "Enregistré" on first load).
    }
  }, []);

  const performSave = useCallback(
    async (field: EntryField, value: number | null) => {
      // Per-field validation against the full schema isolates errors to one
      // field while still using strict types.
      const fieldSchema = entrySchema.shape[field];
      const validation = fieldSchema.safeParse(value);
      if (!validation.success) {
        pending.current.delete(field);
        if (pending.current.size === 0 && inFlight.current.size === 0) {
          setSaveState({ kind: "dirty" });
        }
        return;
      }

      // If offline, leave the field marked pending and let the online
      // listener drain it later.
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setSaveState({ kind: "offline" });
        return;
      }

      pending.current.delete(field);
      inFlight.current.add(field);
      setSaveState({ kind: "saving" });

      try {
        const res = await updateEntryAction(month.id, { [field]: value });
        inFlight.current.delete(field);

        if (res.ok) {
          lastSaved.current = { ...lastSaved.current, [field]: value };
          if (
            pending.current.size === 0 &&
            timers.current.size === 0 &&
            inFlight.current.size === 0
          ) {
            setSaveState({ kind: "saved", at: Date.now() });
          }
        } else {
          // Roll back only if the user hasn't moved on to a newer value.
          if (form.getValues(field) === value) {
            form.setValue(field, lastSaved.current[field], {
              shouldValidate: false,
            });
          }
          toast.error(res.serverError ?? "Échec — réessayer.");
          setSaveState({ kind: "error" });
        }
      } catch {
        inFlight.current.delete(field);
        if (form.getValues(field) === value) {
          form.setValue(field, lastSaved.current[field], {
            shouldValidate: false,
          });
        }
        toast.error("Échec — réessayer.");
        setSaveState({ kind: "error" });
      }

      settleIndicator();
    },
    [form, month.id, settleIndicator],
  );

  const scheduleSave = useCallback(
    (field: EntryField, value: number | null) => {
      pending.current.add(field);
      setSaveState({ kind: "dirty" });

      const existing = timers.current.get(field);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        timers.current.delete(field);
        void performSave(field, value);
      }, DEBOUNCE_MS);
      timers.current.set(field, timer);
    },
    [performSave],
  );

  // Online/offline tracking. When coming back online, drain any pending
  // fields by re-scheduling them with their current form value.
  useEffect(() => {
    function onOnline() {
      if (pending.current.size > 0) {
        const fields = Array.from(pending.current);
        for (const f of fields) {
          scheduleSave(f, form.getValues(f) as number | null);
        }
      } else {
        setSaveState((s) => (s.kind === "offline" ? { kind: "idle" } : s));
      }
    }
    function onOffline() {
      setSaveState({ kind: "offline" });
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (!navigator.onLine) setSaveState({ kind: "offline" });
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [form, scheduleSave]);

  // Clear pending timers when the form unmounts (e.g., month switch).
  useEffect(() => {
    const localTimers = timers.current;
    return () => {
      localTimers.forEach((t) => clearTimeout(t));
      localTimers.clear();
    };
  }, []);

  return (
    <Form {...form}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-end">
          <SaveIndicator state={saveState} />
        </div>

        <KpiGrid
          control={form.control}
          currency={product.currency}
          daysElapsed={daysElapsed}
        />

        <div className="flex flex-col gap-8">
          <SalesSection
            currency={product.currency}
            onFieldChange={scheduleSave}
          />
          <CostsSection
            currency={product.currency}
            onFieldChange={scheduleSave}
          />
          <StockSection onFieldChange={scheduleSave} />
        </div>
      </div>
    </Form>
  );
}
