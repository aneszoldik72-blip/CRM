"use client";

import type { ProductRow } from "@/lib/db/products";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ProductForm,
  type ProductFormValues,
} from "@/components/products/product-form";

export type EditProductDialogProps = {
  product: ProductRow | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    id: string,
    values: ProductFormValues,
  ) => Promise<{
    ok: boolean;
    serverError?: string;
    fieldErrors?: Record<string, string>;
  }>;
};

export function EditProductDialog({
  product,
  onOpenChange,
  onSubmit,
}: EditProductDialogProps) {
  const open = product !== null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
          <DialogDescription>
            Mets à jour les informations de ce produit.
          </DialogDescription>
        </DialogHeader>
        {product && (
          <ProductForm
            key={product.id}
            mode="edit"
            defaultValues={{
              name: product.name,
              country: product.country ?? "",
              currency: product.currency as ProductFormValues["currency"],
            }}
            submitLabel="Mettre à jour"
            onCancel={() => onOpenChange(false)}
            onSubmit={async (values) => {
              const res = await onSubmit(product.id, values);
              if (res.ok) onOpenChange(false);
              return res;
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
