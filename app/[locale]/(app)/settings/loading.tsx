import { Skeleton } from "@/components/ui/skeleton";

// Settings inner-column skeleton. The sidebar (settings-nav) stays put
// from the layout; we only skeleton the right pane.
export default function SettingsLoading() {
  return (
    <section className="flex flex-col gap-7">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </header>
      <div className="grid gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full max-w-sm rounded-lg" />
          </div>
        ))}
      </div>
    </section>
  );
}
