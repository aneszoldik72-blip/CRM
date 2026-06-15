import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  DELETE_CONFIRMATION_PHRASE,
  deleteAccountSchema,
} from "@/lib/validators/profile";

// Permanent account deletion. Requires a service-role client because
// auth.admin.deleteUser cascades through the full FK chain (products →
// months → entries, agents → confirmations, profiles via auth.users).
//
// This must NOT be a server action — the bundle would expose the
// service-role key. Keeping it as a route handler isolates the env read.
export async function POST(request: NextRequest) {
  // 1. Verify the caller's session through the user-scoped client.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate the typed confirmation phrase.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Confirmation phrase does not match." },
      { status: 400 },
    );
  }
  // Defense in depth — the schema already pins it but assert here too.
  if (parsed.data.confirmation !== DELETE_CONFIRMATION_PHRASE) {
    return NextResponse.json({ ok: false, error: "Bad confirmation" }, { status: 400 });
  }

  // 3. Service-role delete. Cascades wipe everything the user owns.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  // 4. Session cleanup. Cookies cleared on the client too; this is a
  //    belt-and-braces server-side sign-out for the current session.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
