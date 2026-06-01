"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProductsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-8 flex size-24 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Plus className="size-10" aria-hidden />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">
        Ajoute ton premier produit.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        C&apos;est d&apos;ici que partent toutes tes campagnes COD.
        Donne-lui un nom, un pays, une devise — et c&apos;est parti.
      </p>
      <Button
        type="button"
        onClick={onAdd}
        className="mt-7 h-11 gap-2 px-5"
      >
        <Plus className="size-4" />
        Ajouter un produit
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        Importer depuis un CSV{" "}
        <span className="text-muted-foreground/60">(bientôt)</span>
      </p>
    </div>
  );
}
