"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { bcp47, type AppLocale } from "@/i18n/routing";
import { getCountry } from "@/lib/data/countries";
import { formatNumber, formatPercent } from "@/lib/format";

export type FunnelRow = {
  id: string;
  name: string;
  country: string | null;
  leads: number;
  orders: number;
  delivered: number;
};

const MAX_VISIBLE = 5;

export function FunnelComparisonChart({
  products,
}: {
  products: FunnelRow[];
}) {
  const t = useTranslations("dashboard");
  const tFunnel = useTranslations("charts.funnel");
  const locale = useLocale() as AppLocale;
  const bcp = bcp47(locale);

  const withTraffic = products.filter(
    (p) => p.leads > 0 || p.orders > 0 || p.delivered > 0,
  );
  if (withTraffic.length === 0) {
    return (
      <section
        aria-label={t("funnels")}
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
      >
        <h2 className="text-base font-semibold tracking-tight">
          {t("funnels")}
        </h2>
        <p className="text-xs text-muted-foreground">{t("noFunnelData")}</p>
      </section>
    );
  }

  const visible = withTraffic.slice(0, MAX_VISIBLE);
  const hidden = withTraffic.length - visible.length;
  const opacities = [1, 0.7, 0.4] as const;
  const stageLabels = [
    tFunnel("leads"),
    tFunnel("orders"),
    tFunnel("delivered"),
  ];

  return (
    <section
      aria-label={t("funnels")}
      className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5"
    >
      <h2 className="text-base font-semibold tracking-tight">
        {t("funnels")}
      </h2>

      <ul className="flex flex-col gap-5">
        {visible.map((p) => {
          const country = getCountry(p.country);
          const stages = [p.leads, p.orders, p.delivered];
          const max = Math.max(p.leads, p.orders, p.delivered, 1);
          const deliveryRate = p.orders > 0 ? p.delivered / p.orders : null;
          return (
            <li key={p.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-sm">
                <Link
                  href={`/products/${p.id}`}
                  className="truncate hover:underline"
                  title={p.name}
                >
                  {country && (
                    <span aria-hidden className="me-1">
                      {country.flag}
                    </span>
                  )}
                  {p.name}
                </Link>
                {deliveryRate !== null && (
                  <span className="text-xs text-muted-foreground">
                    {t("delivery")}{" "}
                    <span className="text-foreground">
                      {formatPercent(deliveryRate, bcp)}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {stages.map((value, i) => {
                  const widthPct =
                    value > 0 ? Math.max((value / max) * 100, 6) : 0;
                  const label = stageLabels[i]!;
                  return (
                    <div
                      key={label}
                      className="grid grid-cols-[minmax(0,5rem)_1fr_minmax(0,3.5rem)] items-center gap-2"
                    >
                      <span className="text-xs text-muted-foreground">
                        {label}
                      </span>
                      <div className="h-3 w-full rounded-sm bg-muted/40">
                        <div
                          className="h-full rounded-sm"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: "var(--chart-1)",
                            opacity: opacities[i],
                          }}
                          aria-hidden
                        />
                      </div>
                      <span className="text-end text-xs font-medium tabular-nums text-foreground">
                        {formatNumber(value, bcp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {hidden > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("moreInTable", { count: hidden })}
        </p>
      )}
    </section>
  );
}
