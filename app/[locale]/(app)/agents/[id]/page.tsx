import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { bcp47, type AppLocale } from "@/i18n/routing";
import { getAgent } from "@/lib/db/agents";
import { listConfirmationsForAgent } from "@/lib/db/confirmations";
import { listProducts } from "@/lib/db/products";
import {
  computeAgentMetrics,
  noAnswer,
  confirmationRate,
  type AgentSnapshot,
  type ConfirmationTotals,
} from "@/lib/agent-metrics";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function dayString(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

function periodBounds(today = new Date()) {
  const t = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const monthStart = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
  const prevMonthStart = new Date(
    Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1),
  );
  const prevMonthEnd = new Date(
    Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0),
  );
  return {
    currentFrom: dayString(monthStart),
    currentTo: dayString(t),
    previousFrom: dayString(prevMonthStart),
    previousTo: dayString(prevMonthEnd),
  };
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("agents.detail");
  const tMetrics = await getTranslations("agents.detail.kpi");
  const tPer = await getTranslations("agents.detail.perProduct");
  const tRecent = await getTranslations("agents.detail.recent");
  const locale = (await getLocale()) as AppLocale;
  const bcp = bcp47(locale);

  const agent = await getAgent(id);
  if (!agent) notFound();

  const ranges = periodBounds();
  const [rows, products] = await Promise.all([
    listConfirmationsForAgent(agent.id, {
      from: ranges.previousFrom,
      to: ranges.currentTo,
    }),
    listProducts(),
  ]);

  const productById = new Map(products.map((p) => [p.id, p]));

  // Build current/previous totals from the row range.
  const ZERO: ConfirmationTotals = { called: 0, confirmed: 0, rejected: 0 };
  const snapshot: AgentSnapshot = {
    agentId: agent.id,
    current: { ...ZERO },
    previous: { ...ZERO },
  };
  for (const r of rows) {
    const within =
      r.date >= ranges.currentFrom && r.date <= ranges.currentTo
        ? "current"
        : r.date >= ranges.previousFrom && r.date <= ranges.previousTo
          ? "previous"
          : null;
    if (!within) continue;
    snapshot[within] = {
      called: snapshot[within].called + r.called,
      confirmed: snapshot[within].confirmed + r.confirmed,
      rejected: snapshot[within].rejected + r.rejected,
    };
  }
  const metrics = computeAgentMetrics(snapshot);

  // Per-product breakdown (current period only).
  const perProduct = new Map<string, ConfirmationTotals>();
  for (const r of rows) {
    if (r.date < ranges.currentFrom || r.date > ranges.currentTo) continue;
    const cur = perProduct.get(r.product_id) ?? { ...ZERO };
    perProduct.set(r.product_id, {
      called: cur.called + r.called,
      confirmed: cur.confirmed + r.confirmed,
      rejected: cur.rejected + r.rejected,
    });
  }
  const perProductRows = Array.from(perProduct.entries())
    .map(([productId, totals]) => ({
      productId,
      product: productById.get(productId),
      totals,
      rate: confirmationRate(totals),
    }))
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

  // Recent activity — last 14 days of rows, sorted desc by date.
  const recent = rows.slice(0, 14);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/agents"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary"
        >
          {agent.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0]!.toUpperCase())
            .join("") || "?"}
        </span>
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
          <p className="text-sm text-muted-foreground">
            {agent.phone ?? <span className="opacity-60">{t("noPhone")}</span>}
          </p>
        </div>
        {!agent.active && (
          <Badge variant="secondary" className="ms-1">
            {t("archivedBadge")}
          </Badge>
        )}
      </header>

      {/* Primary KPI grid */}
      <section
        aria-label={t("thisMonth")}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <Kpi
          label={tMetrics("rate")}
          value={
            metrics.rate.value === null
              ? "—"
              : formatPercent(metrics.rate.value, bcp)
          }
          tone={metrics.rate.tone}
        />
        <Kpi
          label={tMetrics("calls")}
          value={formatNumber(snapshot.current.called, bcp)}
        />
        <Kpi
          label={tMetrics("confirmed")}
          value={formatNumber(snapshot.current.confirmed, bcp)}
        />
        <Kpi
          label={tMetrics("trend")}
          value={
            metrics.trendDelta.value === null
              ? "—"
              : `${metrics.trendDelta.value > 0 ? "▲ +" : "▼ −"}${formatPercent(
                  Math.abs(metrics.trendDelta.value),
                  bcp,
                )}`
          }
          tone={metrics.trendDelta.tone}
        />
      </section>

      {/* Per-product breakdown */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold tracking-tight">
          {tPer("title")}
        </h2>
        {perProductRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {tRecent("empty")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-card text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">
                    {tPer("product")}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {tPer("calls")}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {tPer("confirmed")}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {tPer("rate")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {perProductRows.map((r) => (
                  <tr
                    key={r.productId}
                    className="border-t border-border transition-colors hover:bg-muted/40"
                  >
                    <td className="px-3 py-2">
                      {r.product ? (
                        <Link
                          href={`/products/${r.product.id}`}
                          className="hover:underline"
                        >
                          {r.product.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">
                      {formatNumber(r.totals.called, bcp)}
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">
                      {formatNumber(r.totals.confirmed, bcp)}
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">
                      {r.rate === null ? "—" : formatPercent(r.rate, bcp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold tracking-tight">
          {tRecent("title")}
        </h2>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {tRecent("empty")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-card text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">
                    {tRecent("date")}
                  </th>
                  <th className="px-3 py-2 text-start font-medium">
                    {tRecent("product")}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {tRecent("called")}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {tRecent("confirmed")}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {tRecent("rejected")}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {tRecent("noAnswer")}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {tRecent("rate")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => {
                  const totals: ConfirmationTotals = {
                    called: r.called,
                    confirmed: r.confirmed,
                    rejected: r.rejected,
                  };
                  const rate = confirmationRate(totals);
                  const product = productById.get(r.product_id);
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-border transition-colors hover:bg-muted/40"
                    >
                      <td className="px-3 py-2 tabular-nums">{r.date}</td>
                      <td className="px-3 py-2">
                        {product ? (
                          <Link
                            href={`/products/${product.id}`}
                            className="hover:underline"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums">
                        {formatNumber(r.called, bcp)}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums">
                        {formatNumber(r.confirmed, bcp)}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums">
                        {formatNumber(r.rejected, bcp)}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums">
                        {formatNumber(noAnswer(totals), bcp)}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums">
                        {rate === null ? "—" : formatPercent(rate, bcp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "critical" | "neutral";
}) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums",
          tone === "good" && "text-emerald-500",
          (tone === "bad" || tone === "critical") && "text-destructive",
        )}
      >
        {value}
      </p>
    </article>
  );
}
