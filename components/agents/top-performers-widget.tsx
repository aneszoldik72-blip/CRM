"use client";

import { useTranslations } from "next-intl";
import { Crown, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { AgentRow } from "@/lib/db/agents";
import type { AgentSnapshot } from "@/lib/agent-metrics";
import { Leaderboard } from "@/components/agents/leaderboard";
import { Button } from "@/components/ui/button";

export type TopPerformersWidgetProps = {
  // Echoed back in the link target so the widget is visibly scoped to
  // this product, not whatever happens to be in module-level state.
  productId: string;
  topAgents: { agent: AgentRow; snapshot: AgentSnapshot }[];
  hasAnyAgents: boolean;
};

export function TopPerformersWidget({
  productId,
  topAgents,
  hasAnyAgents,
}: TopPerformersWidgetProps) {
  const t = useTranslations("products.detail.topAgents");

  if (!hasAnyAgents) {
    return (
      <section
        data-product-id={productId}
        className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Users className="size-4" />
          </span>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{t("emptyTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("emptyBody")}</p>
          </div>
        </div>
        <Button
          render={<Link href="/agents" />}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          {t("emptyCta")} →
        </Button>
      </section>
    );
  }

  if (topAgents.length === 0) {
    return (
      <section
        data-product-id={productId}
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-5"
      >
        <Crown aria-hidden className="size-4 text-amber-400" />
        <div className="flex flex-col">
          <p className="text-sm font-medium">{t("title")}</p>
          <p className="text-xs text-muted-foreground">{t("noDataYet")}</p>
        </div>
      </section>
    );
  }

  return (
    <div data-product-id={productId}>
      <Leaderboard topAgents={topAgents} variant="compact" />
    </div>
  );
}
