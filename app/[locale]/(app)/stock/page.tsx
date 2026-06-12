import { getTranslations } from "next-intl/server";

export default async function StockPage() {
  const t = await getTranslations("stock");
  return <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>;
}
