import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardEmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-8 flex size-24 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Plus className="size-10" aria-hidden />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">Bienvenue.</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Ajoute ton premier produit pour voir comment ça avance.
      </p>
      <Button
        className="mt-7 h-11 gap-2 px-5"
        render={<Link href="/products" />}
      >
        <Plus className="size-4" />
        Ajouter un produit
      </Button>
    </div>
  );
}
