import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the populated dashboard layout: header + currency tabs + totals
// hero + 4 KPI cards + diverging-bars chart + funnel chart + products
// table. Same heights as the real components so the swap feels seamless.
export default function DashboardLoading() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-6 md:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24" />
        </div>
      </header>

      <div className="flex justify-center">
        <Skeleton className="h-9 w-72 rounded-lg" />
      </div>

      <section className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-12 w-64 sm:h-14" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </div>
      </section>

      <Skeleton className="h-px w-full" />

      <Skeleton className="h-64 rounded-xl" />

      <Skeleton className="h-px w-full" />

      <Skeleton className="h-72 rounded-xl" />

      <Skeleton className="h-px w-full" />

      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="mb-4 h-5 w-44" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </main>
  );
}
