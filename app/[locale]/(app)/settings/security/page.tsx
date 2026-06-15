import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { EmailChangeForm } from "@/components/settings/email-change-form";
import { PasswordChangeForm } from "@/components/settings/password-change-form";

export default async function SettingsSecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/login");

  // Supabase exposes the in-flight email-change on `user.new_email`.
  const pendingEmail =
    (user as { new_email?: string | null }).new_email ?? null;

  const t = await getTranslations("settings.security");

  return (
    <section className="flex flex-col gap-7">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <EmailChangeForm
        currentEmail={user.email}
        pendingEmail={pendingEmail}
      />
      <PasswordChangeForm />
    </section>
  );
}
