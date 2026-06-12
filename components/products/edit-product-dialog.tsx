"use client";

import { useTranslations } from "next-intl";

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
  const t = useTranslations("products");
  const open = product !== null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editProduct")}</DialogTitle>
          <DialogDescription>{t("editProductDesc")}</DialogDescription>
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
            submitLabel={t("submitEdit")}
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
