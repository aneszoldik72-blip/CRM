"use client";

import { useTranslations } from "next-intl";

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

export type AddProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProductFormValues) => Promise<{
    ok: boolean;
    serverError?: string;
    fieldErrors?: Record<string, string>;
  }>;
};

export function AddProductDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddProductDialogProps) {
  const t = useTranslations("products");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("newProduct")}</DialogTitle>
          <DialogDescription>{t("newProductDesc")}</DialogDescription>
        </DialogHeader>
        <ProductForm
          mode="create"
          submitLabel={t("submitAdd")}
          onCancel={() => onOpenChange(false)}
          onSubmit={async (values) => {
            const res = await onSubmit(values);
            if (res.ok) onOpenChange(false);
            return res;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
