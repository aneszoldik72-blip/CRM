import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DangerSection } from "@/components/settings/danger-section";

export default async function SettingsDangerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/login");

  // Counts for the impact preview. Four small `head: true` queries — RLS
  // narrows each to the current user.
  async function count(table: "products" | "agents" | "entries" | "confirmations") {
    const { count: c } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    return c ?? 0;
  }

  const [products, agents, entries, confirmations] = await Promise.all([
    count("products"),
    count("agents"),
    count("entries"),
    count("confirmations"),
  ]);

  return (
    <DangerSection
      currentEmail={user.email}
      counts={{ products, agents, entries, confirmations }}
    />
  );
}
