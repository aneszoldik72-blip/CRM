import { Skeleton } from "@/components/ui/skeleton";

// Agent detail: back link + header + KPI grid + per-product table + recent
// activity table.
export default function AgentDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-24" />

      <header className="flex flex-wrap items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-32" />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-60 rounded-xl" />
      </section>

      <section className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-80 rounded-xl" />
      </section>
    </div>
  );
}
