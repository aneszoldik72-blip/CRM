import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { routing, type AppLocale } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

// Paths inside the (auth) route group. Logged-in users get bounced away from
// these — except /reset-password, which a recovery session needs to reach.
const AUTH_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
]);

// Paths inside the (app) route group. Route groups don't appear in URLs, so
// these are bare paths (e.g. /dashboard).
const PROTECTED_PATHS = [
  "/dashboard",
  "/products",
  "/agents",
  "/stock",
  "/settings",
];

const intlMiddleware = createIntlMiddleware(routing);

// Strips the locale prefix from a pathname. `/fr/dashboard` → `/dashboard`.
function stripLocale(pathname: string): {
  locale: AppLocale | null;
  rest: string;
} {
  const match = pathname.match(/^\/([^/]+)(\/.*)?$/);
  if (!match) return { locale: null, rest: pathname };
  const maybeLocale = match[1] as AppLocale;
  if (!routing.locales.includes(maybeLocale)) {
    return { locale: null, rest: pathname };
  }
  return { locale: maybeLocale, rest: match[2] ?? "/" };
}

export async function middleware(request: NextRequest) {
  // Rate-limiting for auth POSTs (signIn, signUp, requestPasswordReset)
  // lives inside the server actions themselves — not here. Returning a
  // plain-text 429 from middleware breaks the React Server Action wire
  // protocol and surfaces as a generic crash to the user.

  // Let next-intl decide on the canonical URL first. If it wants to redirect
  // (e.g. add a locale prefix on first visit), do that immediately — auth
  // logic runs on the next request.
  const intlResponse = intlMiddleware(request);
  if (
    intlResponse.headers.get("location") &&
    intlResponse.status >= 300 &&
    intlResponse.status < 400
  ) {
    return intlResponse;
  }

  const { supabaseResponse, user } = await updateSession(request);

  // Copy intl-set headers (x-middleware-* with locale info) onto the supabase
  // response so the App Router still sees them.
  intlResponse.headers.forEach((value, key) => {
    if (key.startsWith("x-middleware-") || key.startsWith("x-next-intl-")) {
      supabaseResponse.headers.set(key, value);
    }
  });

  const { locale, rest } = stripLocale(request.nextUrl.pathname);
  const effectiveLocale: AppLocale = locale ?? routing.defaultLocale;

  // Gate authenticated routes.
  const isProtected = PROTECTED_PATHS.some(
    (p) => rest === p || rest.startsWith(`${p}/`),
  );
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${effectiveLocale}/login`;
    url.searchParams.set("next", rest);
    return NextResponse.redirect(url);
  }

  // Bounce signed-in users away from auth entry pages.
  if (user && AUTH_PATHS.has(rest)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${effectiveLocale}/dashboard`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // Skip Next.js internals, static assets, and the locale-less Supabase
  // callback/confirm endpoints (their URLs are baked into email templates).
  matcher: [
    "/((?!api|_next/static|_next/image|auth/callback|auth/confirm|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
