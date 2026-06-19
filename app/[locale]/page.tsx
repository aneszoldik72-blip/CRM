import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/i18n/routing";

// Locale root. Without this, /en (or /fr, /ar) returns 404, which also breaks
// the top-level not-found "Back home" link (it points to "/" which the locale
// middleware rewrites to /{locale}).
export default async function LocaleRoot({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect({ href: user ? "/dashboard" : "/login", locale });
}
