import { getTranslations } from "next-intl/server";

export default async function AgentsPage() {
  const t = await getTranslations("agents");
  return <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>;
}
