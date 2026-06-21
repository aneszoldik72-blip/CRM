import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Lightweight liveness probe — used by uptime monitors and Vercel's health
// checks. Includes a 1-row Supabase query so a database outage shows up here
// instead of only at request time.
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let db: "ok" | "error" = "ok";
  let dbError: string | undefined;

  try {
    const supabase = await createClient();
    // count: 'exact', head: true → no rows transferred, just a server-side count.
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (error) {
      db = "error";
      dbError = error.message;
    }
  } catch (err) {
    db = "error";
    dbError = err instanceof Error ? err.message : String(err);
  }

  const body = {
    status: db === "ok" ? "ok" : "degraded",
    time: new Date().toISOString(),
    db,
    ...(dbError ? { dbError } : {}),
    elapsedMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: db === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
