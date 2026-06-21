import "server-only";

import { Resend } from "resend";

let cached: Resend | null = null;
let warnedMissing = false;

// Returns null when RESEND_API_KEY is not configured (dev / preview). Callers
// MUST handle this — sending is best-effort, never block a user flow on it.
export function getResend(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (!warnedMissing) {
      console.warn("[email] RESEND_API_KEY is not set — emails will not send");
      warnedMissing = true;
    }
    return null;
  }
  cached = new Resend(key);
  return cached;
}

// Hard-coded fallback to Resend's test sender until a real domain is verified.
// Swap to RESEND_FROM_EMAIL once DNS is set up.
//
// IMPORTANT: onboarding@resend.dev can ONLY deliver to the email address that
// owns the Resend account. Sending to any other address returns a 403. Verify
// a domain (see docs/email-auth.md) before testing with arbitrary recipients.
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "VOIDCRAFT <onboarding@resend.dev>";
