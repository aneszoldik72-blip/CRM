"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { formatMonthLabel, nextYyyymm, prevYyyymm } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GlobalMonthPicker({ selected }: { selected: string }) {
  const router = useRouter();

  function go(yyyymm: string) {
    router.replace(`/dashboard?month=${yyyymm}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Mois précédent"
        onClick={() => go(prevYyyymm(selected))}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <label className="flex items-center gap-2">
        <span className="sr-only">Mois</span>
        <Input
          type="month"
          value={selected}
          onChange={(e) => {
            if (/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value)) {
              go(e.target.value);
            }
          }}
          className="h-9 w-[10.5rem] tabular-nums"
        />
      </label>
      <span className="ms-2 hidden text-sm text-muted-foreground sm:inline">
        {formatMonthLabel(selected)}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Mois suivant"
        onClick={() => go(nextYyyymm(selected))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
