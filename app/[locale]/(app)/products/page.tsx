import { getTranslations } from "next-intl/server";

import { listProducts } from "@/lib/db/products";
import { ProductsClient } from "@/components/products/products-client";

export default async function ProductsPage() {
  const products = await listProducts();
  const t = await getTranslations("products");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <ProductsClient initialProducts={products} />
    </div>
  );
}
