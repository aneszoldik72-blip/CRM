import { Skeleton } from "@/components/ui/skeleton";

// Onboarding shell skeleton — brand + progress + body card.
export default function OnboardingLoading() {
  return (
    <div className="relative min-h-dvh w-full bg-background text-foreground">
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[560px] flex-col gap-8 px-5 py-10 md:py-14">
        <header className="flex flex-col gap-5">
          <Skeleton className="h-7 w-32" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-1 flex-1 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 md:rounded-2xl md:border md:border-border/80 md:bg-card md:p-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="grid gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid gap-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-auto h-12 w-full rounded-lg" />
        </div>
      </main>
    </div>
  );
}
