"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { upsertConfirmationAction } from "@/app/[locale]/(app)/agents/actions";
import { bcp47, type AppLocale } from "@/i18n/routing";
import type { AgentRow } from "@/lib/db/agents";
import type { ConfirmationRow } from "@/lib/db/confirmations";
import {
  confirmationRate,
  noAnswer,
  sumTotals,
  type ConfirmationTotals,
} from "@/lib/agent-metrics";
import type { ConfirmationField } from "@/lib/validators/confirmation";
import { formatNumber, formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IntegerInput } from "@/components/inputs/integer-input";
import {
  SaveIndicator,
  type SaveState,
} from "@/components/entries/save-indicator";

const DEBOUNCE_MS = 800;
const ISO = /^(\d{4}-\d{2}-\d{2})$/;

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
    dt.getUTCDate(),
  ).padStart(2, "0")}`;
}

type Field = ConfirmationField;

type RowState = {
  agentId: string;
  called: number;
  confirmed: number;
  rejected: number;
};

function rowFrom(agentId: string, c: ConfirmationRow | undefined): RowState {
  return {
    agentId,
    called: c?.called ?? 0,
    confirmed: c?.confirmed ?? 0,
    rejected: c?.rejected ?? 0,
  };
}

export type ConfirmationEntryFormProps = {
  productId: string;
  agents: AgentRow[];                  // active agents only
  initialDate: string;                  // YYYY-MM-DD
  initialConfirmations: ConfirmationRow[];
  /** Inclusive lower bound — the selected month's first day. */
  minDate: string;
  /** Inclusive upper bound — the selected month's last day. */
  maxDate: string;
};

export function ConfirmationEntryForm({
  productId,
  agents,
  initialDate,
  initialConfirmations,
  minDate,
  maxDate,
}: ConfirmationEntryFormProps) {
  const t = useTranslations("confirmations.entry");
  const tSave = useTranslations("entries.save");
  const locale = useLocale() as AppLocale;
  const bcp = bcp47(locale);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const date = initialDate;
  const [rows, setRows] = useState<Map<string, RowState>>(() => {
    const map = new Map<string, RowState>();
    const byAgent = new Map<string, ConfirmationRow>();
    for (const c of initialConfirmations) byAgent.set(c.agent_id, c);
    for (const a of agents) map.set(a.id, rowFrom(a.id, byAgent.get(a.id)));
    return map;
  });
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  // One debounce timer per agent row — not per field. All three values for a
  // row save together so the DB's `confirmed + rejected <= called` CHECK sees
  // a consistent triple on every upsert (whether it INSERTs or UPDATEs).
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pending = useRef<Set<string>>(new Set());
  const inFlight = useRef<Set<string>>(new Set());

  // Keep the latest row state reachable from the timer callback without
  // re-binding the timer on every keystroke.
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const teamTotals: ConfirmationTotals = useMemo(
    () =>
      sumTotals(
        Array.from(rows.values()).map((r) => ({
          called: r.called,
          confirmed: r.confirmed,
          rejected: r.rejected,
        })),
      ),
    [rows],
  );
  const teamRate = confirmationRate(teamTotals);

  const performSave = useCallback(
    async (agentId: string) => {
      const row = rowsRef.current.get(agentId);
      if (!row) return;

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setSaveState({ kind: "offline" });
        return;
      }

      // Client-side guard against the CHECK constraint. We still want the
      // server to be authoritative, but failing here gives a fast, friendly
      // error instead of a 400 round-trip.
      if (row.confirmed + row.rejected > row.called) {
        pending.current.delete(agentId);
        if (pending.current.size === 0 && inFlight.current.size === 0) {
          setSaveState({ kind: "dirty" });
        }
        return;
      }

      pending.current.delete(agentId);
      inFlight.current.add(agentId);
      setSaveState({ kind: "saving" });

      const res = await upsertConfirmationAction(
        { agent_id: agentId, product_id: productId, date },
        {
          called: row.called,
          confirmed: row.confirmed,
          rejected: row.rejected,
        },
      );
      inFlight.current.delete(agentId);

      if (res.ok) {
        if (
          pending.current.size === 0 &&
          timers.current.size === 0 &&
          inFlight.current.size === 0
        ) {
          setSaveState({ kind: "saved", at: Date.now() });
        }
      } else {
        toast.error(res.serverError ?? tSave("toastFail"));
        setSaveState({ kind: "error" });
      }
    },
    [date, productId, tSave],
  );

  const scheduleSave = useCallback(
    (agentId: string) => {
      pending.current.add(agentId);
      setSaveState({ kind: "dirty" });
      const existing = timers.current.get(agentId);
      if (existing) clearTimeout(existing);
      const id = setTimeout(() => {
        timers.current.delete(agentId);
        void performSave(agentId);
      }, DEBOUNCE_MS);
      timers.current.set(agentId, id);
    },
    [performSave],
  );

  useEffect(() => {
    const localTimers = timers.current;
    return () => {
      localTimers.forEach((id) => clearTimeout(id));
      localTimers.clear();
    };
  }, []);

  function updateField(agentId: string, field: Field, value: number) {
    setRows((prev) => {
      const next = new Map(prev);
      const row = next.get(agentId);
      if (!row) return prev;
      next.set(agentId, { ...row, [field]: value });
      return next;
    });
    scheduleSave(agentId);
  }

  // Date moves are URL-driven. The parent page reads `?logDate=` server-side
  // and re-passes `initialDate` + `initialConfirmations`, which remounts this
  // form with fresh data.
  function goToDate(next: string) {
    if (!ISO.test(next) || next === date) return;
    // Stay inside the selected MonthSwitcher month — the page-side filter
    // would silently drop logs outside the window anyway.
    if (next < minDate || next > maxDate) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("logDate", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function shiftDay(delta: number) {
    goToDate(shiftDate(date, delta));
  }

  const atMinDate = date <= minDate;
  const atMaxDate = date >= maxDate;

  if (agents.length === 0) {
    return (
      <section
        aria-label={t("title")}
        className="rounded-xl border border-dashed border-border p-6 text-center"
      >
        <p className="text-sm text-muted-foreground">{t("emptyAgents")}</p>
      </section>
    );
  }

  return (
    <section
      aria-label={t("title")}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("prevDay")}
            onClick={() => shiftDay(-1)}
            disabled={atMinDate}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Input
            type="date"
            min={minDate}
            max={maxDate}
            value={date}
            onChange={(e) => goToDate(e.target.value)}
            className="h-9 w-[10.5rem] tabular-nums"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("nextDay")}
            onClick={() => shiftDay(1)}
            disabled={atMaxDate}
          >
            <ChevronRight className="size-4" />
          </Button>
          <span className="ms-2">
            <SaveIndicator state={saveState} />
          </span>
        </div>
      </header>

      <ul className="flex flex-col gap-3">
        {agents.map((agent) => {
          const row = rows.get(agent.id)!;
          const totals: ConfirmationTotals = {
            called: row.called,
            confirmed: row.confirmed,
            rejected: row.rejected,
          };
          const rate = confirmationRate(totals);
          const noAns = noAnswer(totals);
          const over = row.confirmed + row.rejected > row.called;

          return (
            <li
              key={agent.id}
              className={cn(
                "grid gap-3 rounded-lg border border-border bg-background/40 p-4",
                "sm:grid-cols-[1fr_auto]",
                over && "border-destructive/60",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                >
                  {agent.name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s) => s[0]!.toUpperCase())
                    .join("") || "?"}
                </span>
                <div className="flex flex-col">
                  <p className="text-sm font-medium leading-tight">
                    {agent.name}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {rate === null ? "—" : formatPercent(rate, bcp)}
                    {" · "}
                    {t("noAnswerCount", { count: formatNumber(noAns, bcp) })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:w-[19rem]">
                <div className="grid gap-1">
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t("called")}
                  </label>
                  <IntegerInput
                    value={row.called}
                    onChange={(v) => updateField(agent.id, "called", v ?? 0)}
                    enterKeyHint="next"
                    className="h-10 text-end"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t("confirmed")}
                  </label>
                  <IntegerInput
                    value={row.confirmed}
                    onChange={(v) =>
                      updateField(agent.id, "confirmed", v ?? 0)
                    }
                    enterKeyHint="next"
                    className="h-10 text-end"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t("rejected")}
                  </label>
                  <IntegerInput
                    value={row.rejected}
                    onChange={(v) =>
                      updateField(agent.id, "rejected", v ?? 0)
                    }
                    enterKeyHint="done"
                    className="h-10 text-end"
                  />
                </div>
              </div>

              {over && (
                <p className="text-xs text-destructive sm:col-span-2">
                  {t("overCalled")}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>
          {t("teamTotals", {
            calls: formatNumber(teamTotals.called, bcp),
            confirmed: formatNumber(teamTotals.confirmed, bcp),
          })}
        </span>
        <span className="tabular-nums">
          {t("teamRate")}{" "}
          <span className="font-medium text-foreground">
            {teamRate === null ? "—" : formatPercent(teamRate, bcp)}
          </span>
        </span>
      </footer>
    </section>
  );
}
