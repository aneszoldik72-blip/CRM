import "server-only";

import * as Sentry from "@sentry/nextjs";

import { FROM_EMAIL, getResend } from "./resend";
import { PaymentFailedEmail, type PaymentFailedEmailProps } from "./templates/payment-failed";
import { TrialEndingEmail, type TrialEndingEmailProps } from "./templates/trial-ending";
import { WelcomeEmail, type WelcomeEmailProps } from "./templates/welcome";

// All sends are best-effort: a Resend outage or missing API key should never
// surface to the user. We capture failures to Sentry and return a result so
// callers can branch on it (e.g. don't mark welcome_email_sent_at if it
// failed).
export type SendResult = { sent: boolean; id?: string; error?: string };

async function send(
  to: string,
  subject: string,
  react: React.ReactNode,
): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    console.error("[email] send aborted — RESEND_API_KEY missing", {
      to,
      subject,
    });
    return { sent: false, error: "RESEND_API_KEY missing" };
  }
  console.log("[email] sending", { from: FROM_EMAIL, to, subject });
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
    });
    if (error) {
      // Resend errors are objects like { statusCode, name, message }. Log the
      // whole thing — `message` alone often loses the actionable bit (e.g.
      // "You can only send testing emails to your own email address").
      console.error("[email] Resend returned an error", {
        from: FROM_EMAIL,
        to,
        subject,
        error,
      });
      Sentry.captureMessage("Resend send failed", {
        level: "warning",
        extra: { from: FROM_EMAIL, to, subject, error },
      });
      return { sent: false, error: error.message };
    }
    console.log("[email] sent", { to, subject, id: data?.id });
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error("[email] send threw", { to, subject, err });
    Sentry.captureException(err, { extra: { from: FROM_EMAIL, to, subject } });
    return {
      sent: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function sendWelcome(to: string, props: WelcomeEmailProps) {
  return send(to, "Bienvenue sur VOIDCRAFT", WelcomeEmail(props));
}

export function sendPaymentFailed(to: string, props: PaymentFailedEmailProps) {
  return send(to, "Échec du paiement — action requise", PaymentFailedEmail(props));
}

export function sendTrialEnding(to: string, props: TrialEndingEmailProps) {
  const label = props.daysLeft === 1 ? "1 jour" : `${props.daysLeft} jours`;
  return send(to, `Ton essai se termine dans ${label}`, TrialEndingEmail(props));
}
