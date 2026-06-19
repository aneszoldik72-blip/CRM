import { cn } from "@/lib/utils";

// Renders a placeholder media frame for a marketing screenshot. Real PNGs are
// dropped under /public/screenshots/* by hand; this component should be
// swapped for <Image> per slot once the assets exist.
//
// Expected files (1600×1000 unless noted):
//   /public/screenshots/dashboard.png         — hero
//   /public/screenshots/agents.png            — solution row 2
//   /public/screenshots/products.png          — solution row 3
//   /public/screenshots/stock.png             — solution row 4
//   /public/screenshots/rtl.png               — solution row 5 (Arabic UI)
//   /public/screenshots/agent-detail.png      — differentiator
//   /public/screenshots/before-excel.png      — 800×600
//   /public/screenshots/after-voidcraft.png   — 800×600
export type ScreenshotProps = {
  alt: string;
  ratio?: "wide" | "card";
  variant?: "default" | "dim";
  className?: string;
};

export function Screenshot({
  alt,
  ratio = "wide",
  variant = "default",
  className,
}: ScreenshotProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br shadow-2xl shadow-primary/10",
        ratio === "wide" ? "aspect-[16/10]" : "aspect-[4/3]",
        variant === "default"
          ? "from-neutral-900 via-neutral-950 to-black"
          : "from-neutral-950 via-black to-neutral-900 opacity-60",
        className,
      )}
    >
      {/* Subtle window chrome to suggest "real product screenshot" */}
      <div className="absolute inset-x-0 top-0 flex h-8 items-center gap-1.5 border-b border-white/5 bg-white/[0.02] px-3">
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
      </div>
      <div className="absolute inset-0 top-8 flex items-center justify-center">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white/40">
          Aperçu
        </span>
      </div>
      {/* Soft accent glow */}
      <div className="pointer-events-none absolute -bottom-32 start-1/2 size-[400px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
    </div>
  );
}
