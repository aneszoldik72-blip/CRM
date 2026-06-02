"use client";

import { cn } from "@/lib/utils";

export type ChartSkeletonProps = {
  variant: "funnel" | "donut" | "trend";
  className?: string;
};

export function ChartSkeleton({ variant, className }: ChartSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Chargement du graphique"
      className={cn(
        "relative flex h-[200px] w-full items-center justify-center",
        className,
      )}
    >
      {variant === "funnel" && <FunnelSkeleton />}
      {variant === "donut" && <DonutSkeleton />}
      {variant === "trend" && <TrendSkeleton />}
    </div>
  );
}

function FunnelSkeleton() {
  // Three stacked trapezoids that shrink, mirroring the live funnel.
  return (
    <div className="flex h-full w-full max-w-xs flex-col items-center justify-center gap-1.5 py-2">
      <div className="h-9 w-full animate-pulse rounded-sm bg-muted" />
      <div className="h-9 w-3/4 animate-pulse rounded-sm bg-muted" />
      <div className="h-9 w-1/2 animate-pulse rounded-sm bg-muted" />
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className="relative size-36 animate-pulse">
      <div className="absolute inset-0 rounded-full bg-muted" />
      <div className="absolute inset-[22%] rounded-full bg-card" />
    </div>
  );
}

function TrendSkeleton() {
  const bars = [50, 80, 35, 65, 90, 45];
  return (
    <div className="flex h-full w-full max-w-md items-end justify-around gap-2 px-4 py-2">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-full animate-pulse rounded-t-sm bg-muted"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
