"use client";

import { useLocale, useTranslations } from "next-intl";
import { Archive, ArchiveRestore, Crown, MoreVertical, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { bcp47, type AppLocale } from "@/i18n/routing";
import type { AgentRow } from "@/lib/db/agents";
import {
  computeAgentMetrics,
  tierFor,
  type AgentSnapshot,
  type AgentTier,
} from "@/lib/agent-metrics";
import { formatNumber, formatPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AgentCardProps = {
  agent: AgentRow;
  snapshot: AgentSnapshot;
  rank: number;
  onEdit: (agent: AgentRow) => void;
  onArchiveToggle: (agent: AgentRow) => void;
};

function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]!.toUpperCase())
      .join("") || "?"
  );
}

export function AgentCard({
  agent,
  snapshot,
  rank,
  onEdit,
  onArchiveToggle,
}: AgentCardProps) {
  const t = useTranslations("agents.card");
  const locale = useLocale() as AppLocale;
  const bcp = bcp47(locale);

  const m = computeAgentMetrics(snapshot);
  const archived = !agent.active;
  const tier: AgentTier = archived ? "review" : tierFor(m.rate.value, rank);
  const isCrown = !archived && tier === "top";

  const rateLabel =
    m.rate.value === null ? "—" : formatPercent(m.rate.value, bcp);

  const deltaStr = (() => {
    if (m.trendDelta.value === null) return null;
    const pts = m.trendDelta.value * 100;
    const sign = pts > 0 ? "▲ +" : pts < 0 ? "▼ −" : "= ";
    return `${sign}${formatPercent(Math.abs(pts) / 100, bcp)}`;
  })();

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-5 transition-colors",
        isCrown
          ? "border-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]"
          : "border-border hover:border-primary/30",
        archived && "opacity-70",
      )}
    >
      {isCrown && (
        <Crown
          aria-hidden
          className="pointer-events-none absolute end-3 top-3 size-4 text-amber-400"
        />
      )}

      {/* Header: avatar + name */}
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            isCrown
              ? "bg-amber-400/15 text-amber-300"
              : "bg-primary/10 text-primary",
          )}
        >
          {initialsFromName(agent.name)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate text-base font-medium leading-tight">
            {agent.name}
          </h3>
          {agent.phone && (
            <p className="truncate text-xs text-muted-foreground">
              {agent.phone}
            </p>
          )}
        </div>
      </div>

      {/* Hero metric: confirmation rate */}
      <div className="flex flex-col items-start gap-0.5 pt-1">
        <p
          className={cn(
            "text-4xl font-semibold tabular-nums leading-none",
            m.rate.tone === "good" && "text-emerald-500",
            m.rate.tone === "bad" && "text-destructive",
            m.rate.tone === "critical" && "text-destructive",
          )}
        >
          {rateLabel}
        </p>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {t("rate")}
        </p>
      </div>

      {/* Trend + calls */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {formatNumber(snapshot.current.called, bcp)} {t("calls")}
        </span>
        {deltaStr ? (
          <span
            className={cn(
              "tabular-nums",
              m.trendDelta.tone === "good" && "text-emerald-500",
              m.trendDelta.tone === "bad" && "text-destructive",
            )}
          >
            {deltaStr}
          </span>
        ) : (
          <span className="text-muted-foreground/60">{t("trendNone")}</span>
        )}
      </div>

      {/* Tier badge */}
      <div className="flex items-center justify-between">
        <Badge
          variant={tier === "review" ? "destructive" : "secondary"}
          className={cn(
            "border-transparent",
            tier === "top" &&
              "bg-amber-400/15 text-amber-300 hover:bg-amber-400/15",
          )}
        >
          {tier === "top" && <Crown className="size-3" aria-hidden />}
          {t(`tier.${tier}`)}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("moreActions")}
              />
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onEdit(agent);
              }}
            >
              <Pencil /> {t("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onArchiveToggle(agent);
              }}
            >
              {archived ? (
                <>
                  <ArchiveRestore /> {t("unarchive")}
                </>
              ) : (
                <>
                  <Archive /> {t("archive")}
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link
        href={`/agents/${agent.id}`}
        aria-label={t("openAria", { name: agent.name })}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </article>
  );
}
