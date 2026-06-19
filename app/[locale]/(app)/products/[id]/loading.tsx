import { Skeleton } from "@/components/ui/skeleton";

// Product detail: back link + header + month switcher + top performers +
// entry form (KPI grid + charts + sections).
export default function ProductDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-24" />

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-24" />
      </div>

      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-20 rounded-xl" />

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-px w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-64 rounded-xl" />

      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-11 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
