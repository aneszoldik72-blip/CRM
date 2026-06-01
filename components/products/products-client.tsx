"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { ProductRow } from "@/lib/db/products";
import {
  archiveProductAction,
  createProductAction,
  unarchiveProductAction,
  updateProductAction,
} from "@/app/(app)/products/actions";
import { AddProductDialog } from "@/components/products/add-product-dialog";
import { EditProductDialog } from "@/components/products/edit-product-dialog";
import { ProductCard } from "@/components/products/product-card";
import { ProductsEmptyState } from "@/components/products/empty-state";
import {
  ProductsToolbar,
  type ProductStatus,
} from "@/components/products/products-toolbar";

type OptimisticAction =
  | { type: "add"; product: ProductRow }
  | { type: "toggleArchive"; id: string };

function isPendingId(id: string): boolean {
  return id.startsWith("temp-");
}

export function ProductsClient({
  initialProducts,
}: {
  initialProducts: ProductRow[];
}) {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const status: ProductStatus =
    statusParam === "archived" || statusParam === "all"
      ? statusParam
      : "active";
  const query = searchParams.get("q") ?? "";

  const [optimisticProducts, applyOptimistic] = useOptimistic<
    ProductRow[],
    OptimisticAction
  >(initialProducts, (state, action) => {
    switch (action.type) {
      case "add":
        return [action.product, ...state];
      case "toggleArchive":
        return state.map((p) =>
          p.id === action.id ? { ...p, archived: !p.archived } : p,
        );
    }
  });

  const [, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductRow | null>(null);

  const counts = useMemo(
    () => ({
      active: optimisticProducts.filter((p) => !p.archived).length,
      archived: optimisticProducts.filter((p) => p.archived).length,
      all: optimisticProducts.length,
    }),
    [optimisticProducts],
  );

  const filteredProducts = useMemo(() => {
    let list = optimisticProducts;
    if (status === "active") list = list.filter((p) => !p.archived);
    else if (status === "archived") list = list.filter((p) => p.archived);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  }, [optimisticProducts, status, query]);

  function handleAdd(
    values: Parameters<typeof createProductAction>[0],
  ): ReturnType<typeof createProductAction> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const v = values as {
          name: string;
          country: string;
          currency: ProductRow["currency"];
        };
        const optimisticProduct: ProductRow = {
          id: `temp-${crypto.randomUUID()}`,
          user_id: "",
          name: v.name,
          country: v.country,
          currency: v.currency,
          image_url: null,
          archived: false,
          created_at: new Date().toISOString(),
        };
        applyOptimistic({ type: "add", product: optimisticProduct });

        const res = await createProductAction(values);
        if (res.ok) {
          toast.success("Produit ajouté");
        } else if (res.serverError) {
          toast.error(res.serverError);
        }
        resolve(res);
      });
    });
  }

  function handleEdit(
    id: string,
    values: Parameters<typeof updateProductAction>[1],
  ): ReturnType<typeof updateProductAction> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateProductAction(id, values);
        if (res.ok) {
          toast.success("Produit mis à jour");
        } else if (res.serverError) {
          toast.error(res.serverError);
        }
        resolve(res);
      });
    });
  }

  function handleArchiveToggle(product: ProductRow) {
    startTransition(async () => {
      applyOptimistic({ type: "toggleArchive", id: product.id });
      const action = product.archived
        ? unarchiveProductAction
        : archiveProductAction;
      const res = await action(product.id);
      if (res.ok) {
        toast.success(
          product.archived ? "Produit désarchivé" : "Produit archivé",
        );
      } else if (res.serverError) {
        toast.error(res.serverError);
      }
    });
  }

  const isEmptyOverall = counts.all === 0;
  const isFilteredEmpty = filteredProducts.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {!isEmptyOverall && (
        <ProductsToolbar
          status={status}
          query={query}
          counts={counts}
          onAdd={() => setAddOpen(true)}
        />
      )}

      {isEmptyOverall ? (
        <ProductsEmptyState onAdd={() => setAddOpen(true)} />
      ) : isFilteredEmpty ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {query
            ? `Aucun produit ne correspond à « ${query} ».`
            : status === "archived"
              ? "Aucun produit archivé."
              : "Aucun produit pour ce filtre."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              pending={isPendingId(p.id)}
              onEdit={(target) => setEditTarget(target)}
              onArchiveToggle={handleArchiveToggle}
            />
          ))}
        </div>
      )}

      {/* Mobile FAB — desktop uses the header Add button */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        aria-label="Ajouter un produit"
        className="fixed bottom-20 end-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 sm:hidden"
      >
        <Plus className="size-6" />
      </button>

      <AddProductDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
      />
      <EditProductDialog
        product={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onSubmit={handleEdit}
      />
    </div>
  );
}
