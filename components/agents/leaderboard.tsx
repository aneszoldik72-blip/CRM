"use client";

import { useLocale, useTranslations } from "next-intl";
import { Crown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { bcp47, type AppLocale } from "@/i18n/routing";
import type { AgentRow } from "@/lib/db/agents";
import {
  computeAgentMetrics,
  type AgentSnapshot,
} from "@/lib/agent-metrics";
import { formatNumber, formatPercent } from "@/lib/format";

type RankedAgent = {
  agent: AgentRow;
  snapshot: AgentSnapshot;
};

export type LeaderboardProps = {
  // Already ranked (1st in position 0). Pass at most 3.
  topAgents: RankedAgent[];
  // Compact = single-line list (for the product page widget).
  // Podium = full podium block (for /agents).
  variant?: "podium" | "compact";
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

const POSITION_CLASSES = {
  1: {
    ring: "ring-amber-400/40",
    bg: "bg-amber-400/10",
    text: "text-amber-300",
    label: "1st",
  },
  2: {
    ring: "ring-zinc-400/30",
    bg: "bg-zinc-400/10",
    text: "text-zinc-300",
    label: "2nd",
  },
  3: {
    ring: "ring-orange-700/30",
    bg: "bg-orange-700/10",
    text: "text-orange-300",
    label: "3rd",
  },
} as const;

export function Leaderboard({ topAgents, variant = "podium" }: LeaderboardProps) {
  const t = useTranslations("agents.leaderboard");
  const locale = useLocale() as AppLocale;
  const bcp = bcp47(locale);

  if (topAgents.length === 0) return null;

  if (variant === "compact") {
    return (
      <section
        aria-label={t("title")}
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <Crown className="size-4 text-amber-400" aria-hidden />
            {t("title")}
          </h2>
          <Link
            href="/agents"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("seeAll")} →
          </Link>
        </div>

        <ul className="flex flex-col gap-2">
          {topAgents.map(({ agent, snapshot }, i) => {
            const m = computeAgentMetrics(snapshot);
            const pct = m.rate.value;
            const widthPct = pct === null ? 0 : Math.max(pct * 100, 2);
            const pos = (i + 1) as 1 | 2 | 3;
            return (
              <li
                key={agent.id}
                className="grid grid-cols-[1.5rem_auto_1fr_auto] items-center gap-3 text-sm"
              >
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {i + 1}.
                </span>
                <Link
                  href={`/agents/${agent.id}`}
                  className="flex items-center gap-2 truncate hover:underline"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      POSITION_CLASSES[pos].bg,
                      POSITION_CLASSES[pos].text,
                    )}
                  >
                    {initialsFromName(agent.name)}
                  </span>
                  <span className="truncate">{agent.name}</span>
                </Link>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      m.rate.tone === "good"
                        ? "bg-emerald-500"
                        : m.rate.tone === "bad" || m.rate.tone === "critical"
                          ? "bg-destructive"
                          : "bg-primary",
                    )}
                    style={{ width: `${widthPct}%` }}
                    aria-hidden
                  />
                </div>
                <span className="tabular-nums text-end text-foreground">
                  {pct === null ? "—" : formatPercent(pct, bcp)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  // Podium variant
  const first = topAgents[0]!;
  const second = topAgents[1];
  const third = topAgents[2];

  return (
    <section
      aria-label={t("title")}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <Crown className="size-4 text-amber-400" aria-hidden />
          {t("title")}
        </h2>
        <span className="text-xs text-muted-foreground">{t("thisMonth")}</span>
      </div>

      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
        {/* Mobile: 1st on top. Desktop: 2nd, 1st, 3rd */}
        <div className="sm:order-2">
          <PodiumCard
            data={first}
            position={1}
            locale={bcp}
            firstLabel={t("podium.first")}
          />
        </div>
        {second && (
          <div className="sm:order-1">
            <PodiumCard
              data={second}
              position={2}
              locale={bcp}
              firstLabel={t("podium.second")}
            />
          </div>
        )}
        {third && (
          <div className="sm:order-3">
            <PodiumCard
              data={third}
              position={3}
              locale={bcp}
              firstLabel={t("podium.third")}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function PodiumCard({
  data,
  position,
  locale,
  firstLabel,
}: {
  data: RankedAgent;
  position: 1 | 2 | 3;
  locale: string;
  firstLabel: string;
}) {
  const t = useTranslations("agents.card");
  const m = computeAgentMetrics(data.snapshot);
  const cls = POSITION_CLASSES[position];
  const rateLabel =
    m.rate.value === null ? "—" : formatPercent(m.rate.value, locale);

  const deltaStr = (() => {
    if (m.trendDelta.value === null) return null;
    const pts = m.trendDelta.value * 100;
    const sign = pts > 0 ? "▲ +" : pts < 0 ? "▼ −" : "= ";
    return `${sign}${formatPercent(Math.abs(pts) / 100, locale)}`;
  })();

  return (
    <Link
      href={`/agents/${data.agent.id}`}
      className={cn(
        "group relative flex flex-col items-center gap-3 rounded-xl border bg-background/40 p-5 text-center transition-all",
        position === 1 && "py-7 ring-2",
        position !== 1 && "ring-1",
        cls.ring,
        "hover:bg-background/70",
      )}
    >
      <div className="flex items-center gap-1.5">
        {position === 1 && (
          <Crown className="size-3.5 text-amber-400" aria-hidden />
        )}
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider", cls.text)}>
          {firstLabel}
        </span>
      </div>

      <div
        aria-hidden
        className={cn(
          "flex size-12 items-center justify-center rounded-full text-base font-semibold",
          cls.bg,
          cls.text,
        )}
      >
        {data.agent.name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((s) => s[0]!.toUpperCase())
          .join("")}
      </div>

      <p className="line-clamp-1 text-sm font-medium">{data.agent.name}</p>

      <p
        className={cn(
          "text-3xl font-semibold tabular-nums leading-none",
          m.rate.tone === "good" && "text-emerald-500",
          m.rate.tone === "bad" && "text-destructive",
          m.rate.tone === "critical" && "text-destructive",
        )}
      >
        {rateLabel}
      </p>

      <div className="flex flex-col items-center gap-0.5 text-[11px] text-muted-foreground">
        <span className="tabular-nums">
          {formatNumber(data.snapshot.current.called, locale)} {t("calls")}
        </span>
        {deltaStr && (
          <span
            className={cn(
              "tabular-nums",
              m.trendDelta.tone === "good" && "text-emerald-500",
              m.trendDelta.tone === "bad" && "text-destructive",
            )}
          >
            {deltaStr}
          </span>
        )}
      </div>
    </Link>
  );
}
