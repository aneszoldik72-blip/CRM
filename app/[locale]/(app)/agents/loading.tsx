import { Skeleton } from "@/components/ui/skeleton";

// Agents list: header + status tabs + leaderboard podium + card grid.
export default function AgentsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-10 w-28" />
        </div>
      </header>

      {/* Podium */}
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
        <Skeleton className="h-44 rounded-xl sm:order-1" />
        <Skeleton className="h-52 rounded-xl sm:order-2" />
        <Skeleton className="h-44 rounded-xl sm:order-3" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
