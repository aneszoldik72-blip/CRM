import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { routing, type AppLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

function detectLocale(request: NextRequest): AppLocale {
  const cookie = request.cookies.get("NEXT_LOCALE")?.value as
    | AppLocale
    | undefined;
  if (cookie && (routing.locales as readonly string[]).includes(cookie)) {
    return cookie;
  }
  return routing.defaultLocale;
}

// Supabase email confirmations (signup, recovery, email change, invite) land
// here. We verify the token_hash server-side — which sets the session cookie —
// then forward to `next`.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/";
  const locale = detectLocale(request);

  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const safe = nextParam.startsWith("/") ? nextParam : "/";
      redirectTo.pathname = `/${locale}${safe}`;
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = `/${locale}/login`;
  redirectTo.searchParams.set("error", "invalid_link");
  return NextResponse.redirect(redirectTo);
}
