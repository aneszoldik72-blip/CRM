"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/auth/brand-mark";
import { ProgressBar } from "./progress-bar";

export type OnboardingCardProps = {
  step: number;
  total: number;
  children: ReactNode;
  className?: string;
};

// Shared shell for all 5 steps. Centred card on desktop, full-screen on
// mobile. Brand mark + progress bar in the header.
export function OnboardingCard({
  step,
  total,
  children,
  className,
}: OnboardingCardProps) {
  return (
    <div className="relative min-h-dvh w-full bg-background text-foreground">
      {/* Soft top-right light source for warmth without distraction. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 end-[-10rem] h-[520px] w-[520px] rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(circle at center, #8b6bff 0%, transparent 60%)",
        }}
      />

      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[560px] flex-col gap-8 px-5 py-10 md:py-14">
        <header className="flex flex-col gap-5">
          <BrandMark />
          <ProgressBar step={step} total={total} />
        </header>

        <div
          className={cn(
            "flex flex-1 flex-col gap-6 md:rounded-2xl md:border md:border-border/80 md:bg-card md:p-8 md:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
            className,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
