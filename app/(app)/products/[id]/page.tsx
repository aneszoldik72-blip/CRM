import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCountry } from "@/lib/data/countries";
import { getEntry } from "@/lib/db/entries";
import {
  getOrCreateCurrentMonth,
  listMonths,
  type MonthRow,
} from "@/lib/db/months";
import { getProduct } from "@/lib/db/products";
import { Badge } from "@/components/ui/badge";
import { EntryForm } from "@/components/entries/entry-form";
import { MonthSwitcher } from "@/components/months/month-switcher";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month: monthParam } = await searchParams;

  const product = await getProduct(id);
  if (!product) notFound();

  let months = await listMonths(id);
  if (months.length === 0) {
    await getOrCreateCurrentMonth(id);
    months = await listMonths(id);
  }

  let selected: MonthRow | undefined;
  if (monthParam) {
    selected = months.find((m) => m.id === monthParam);
    if (!selected) {
      // Invalid month param — drop it and land on newest.
      redirect(`/products/${id}`);
    }
  } else {
    selected = months[0];
  }

  if (!selected) {
    // Should not happen given the auto-create above, but a defensive guard.
    throw new Error("Aucun mois disponible pour ce produit.");
  }

  const country = getCountry(product.country);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/products"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Produits
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {country && (
              <>
                <span aria-hidden>{country.flag}</span>
                <span>{country.code}</span>
                <span aria-hidden>·</span>
              </>
            )}
            <span>{product.currency}</span>
            {product.archived && (
              <Badge variant="secondary" className="ms-1">
                Archivé
              </Badge>
            )}
          </div>
        </div>
      </div>

      <MonthSwitcher
        productId={product.id}
        months={months}
        selectedMonthId={selected.id}
      />

      <EntryForm
        key={selected.id}
        entry={await getEntry(selected.id)}
        month={selected}
        product={product}
      />
    </div>
  );
}
