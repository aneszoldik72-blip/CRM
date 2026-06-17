"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import confetti from "canvas-confetti";

// Renders nothing. Fires a one-shot confetti burst on mount and strips the
// triggering query param so a reload doesn't replay it. Respects
// prefers-reduced-motion (silently no-ops).
export function WelcomeConfetti() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      const end = Date.now() + 1500;
      const colors = ["#8b6bff", "#10b981", "#f59e0b"];
      const tick = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
        });
        if (Date.now() < end) {
          requestAnimationFrame(tick);
        }
      };
      tick();
    }

    // Strip ?welcome=1 so a reload won't re-trigger. router.replace keeps
    // the page state intact.
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return null;
}
