import { NextResponse, type NextRequest } from "next/server";
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
// these are bare paths (e.g. /dashboard, not /app/dashboard).
const PROTECTED_PATHS = [
  "/dashboard",
  "/products",
  "/agents",
  "/stock",
  "/settings",
];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Gate authenticated routes.
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Bounce signed-in users away from auth entry pages.
  if (user && AUTH_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
