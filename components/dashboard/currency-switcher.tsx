"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { updateDefaultCurrencyAction } from "@/app/(app)/dashboard/actions";
import { BASE_CURRENCIES, type BaseCurrency } from "@/lib/validators/profile";

export function CurrencySwitcher({ selected }: { selected: BaseCurrency }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function go(next: BaseCurrency) {
    if (next === selected) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("currency", next);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      // Fire-and-forget — remembered for the next visit. URL is the source of
      // truth for the current view, so we don't need to await this.
      void updateDefaultCurrencyAction(next);
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Devise des totaux"
      className={cn(
        "flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 text-xs",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {BASE_CURRENCIES.map((code) => {
        const active = code === selected;
        return (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={pending && !active}
            onClick={() => go(code)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
