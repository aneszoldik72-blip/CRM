import { NextResponse, type NextRequest } from "next/server";

import { routing, type AppLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

// Reads the locale cookie that next-intl writes; falls back to the default.
function detectLocale(request: NextRequest): AppLocale {
  const cookie = request.cookies.get("NEXT_LOCALE")?.value as
    | AppLocale
    | undefined;
  if (cookie && (routing.locales as readonly string[]).includes(cookie)) {
    return cookie;
  }
  return routing.defaultLocale;
}

// Supabase email links land here. We exchange the code for a session, then
// route the user to wherever they were headed.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const locale = detectLocale(request);

  if (!code) {
    return NextResponse.redirect(
      `${origin}/${locale}/login?error=missing_code`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/${locale}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Only allow same-origin relative redirects.
  const safeNext = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(`${origin}/${locale}${safeNext}`);
}
