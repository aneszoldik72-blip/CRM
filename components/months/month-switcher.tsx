"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { MonthRow } from "@/lib/db/months";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AddMonthDialog } from "@/components/months/add-month-dialog";

export type MonthSwitcherProps = {
  productId: string;
  months: MonthRow[]; // newest first
  selectedMonthId: string;
};

export function MonthSwitcher({
  productId,
  months,
  selectedMonthId,
}: MonthSwitcherProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Tabs render newest-first; for the year-grouped popover we group by year
  // (also newest first within each year).
  const groupedByYear = useMemo(() => {
    const groups = new Map<string, MonthRow[]>();
    for (const m of months) {
      const year = m.start_date.slice(0, 4);
      const list = groups.get(year);
      if (list) list.push(m);
      else groups.set(year, [m]);
    }
    return Array.from(groups.entries());
  }, [months]);

  // Center the active tab on mount and whenever the selection changes.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>(
      `[data-month-id="${selectedMonthId}"]`,
    );
    if (active) {
      active.scrollIntoView({ inline: "center", block: "nearest" });
    }
  }, [selectedMonthId]);

  function go(monthId: string) {
    router.replace(`/products/${productId}?month=${monthId}`, { scroll: false });
  }

  function scrollBy(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <>
      <div className="flex items-stretch gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Mois précédents"
          onClick={() => scrollBy(-240)}
          className="hidden self-center md:inline-flex"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div
          ref={scrollRef}
          role="tablist"
          aria-label="Sélection du mois"
          className="flex min-w-0 flex-1 snap-x snap-mandatory items-end gap-1 overflow-x-auto scroll-smooth pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {months.map((m) => {
            const active = m.id === selectedMonthId;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-month-id={m.id}
                onClick={() => go(m.id)}
                className={cn(
                  "relative shrink-0 snap-start whitespace-nowrap rounded-t-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {m.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Mois suivants"
          onClick={() => scrollBy(240)}
          className="hidden self-center md:inline-flex"
        >
          <ChevronRight className="size-4" />
        </Button>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Voir tous les mois"
                className="self-center"
              />
            }
          >
            <CalendarRange className="size-4" />
          </PopoverTrigger>
          <PopoverContent align="end" className="max-h-[60vh] w-64 overflow-y-auto p-1">
            {groupedByYear.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Aucun mois.
              </p>
            ) : (
              groupedByYear.map(([year, list]) => (
                <div key={year} className="py-1">
                  <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                    {year}
                  </p>
                  {list.map((m) => {
                    const active = m.id === selectedMonthId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => go(m.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted",
                        )}
                      >
                        <span>{m.label}</span>
                        {active && (
                          <span className="text-xs text-primary">●</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          onClick={() => setAddOpen(true)}
          className="h-9 shrink-0 gap-1.5 self-center px-3"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>

      <AddMonthDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        productId={productId}
        existingMonths={months}
        onCreated={(m) => {
          toast.success("Mois ajouté");
          router.replace(`/products/${productId}?month=${m.id}`, {
            scroll: false,
          });
        }}
      />
    </>
  );
}
