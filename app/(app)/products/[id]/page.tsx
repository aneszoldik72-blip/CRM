import { notFound } from "next/navigation";

import { getProduct } from "@/lib/db/products";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
  );
}
