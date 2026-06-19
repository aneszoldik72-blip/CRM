"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Mail, RotateCw } from "lucide-react";

import { cn } from "@/lib/utils";

const SUPPORT_EMAIL = "support@voidcraft.app";

export type ErrorScreenProps = {
  /** The Error caught by the boundary. Forwarded to console + dev display. */
  error?: Error & { digest?: string };
  /** When provided, the Retry button calls this to re-render the segment. */
  reset?: () => void;
  /** Render in fullscreen mode (used by global-error which has no app shell). */
  fullscreen?: boolean;
  /** Optional secondary action (e.g. "Skip onboarding" on the onboarding boundary). */
  secondaryHref?: string;
  /** Label for the secondary action. */
  secondaryLabel?: string;
};

export function ErrorScreen({
  error,
  reset,
  fullscreen,
  secondaryHref,
  secondaryLabel,
}: ErrorScreenProps) {
  const t = useTranslations("errors.screen");

  useEffect(() => {
    if (error) {
      console.error("[ErrorScreen] caught", error);
    }
  }, [error]);

  const subject = encodeURIComponent("VOIDCRAFT — support");
  const body = encodeURIComponent(
    `\n\n---\n${error?.digest ? `Digest: ${error.digest}\n` : ""}${
      error?.message ? `Message: ${error.message}\n` : ""
    }`,
  );
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <div
      role="alert"
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center gap-5 px-6 text-center",
        fullscreen ? "min-h-dvh justify-center py-10" : "py-16",
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("body")}
        </p>
      </div>

      {/* In production, error.digest is the only thing safe to surface. The
          raw message is hidden from users but shown in dev so we can see what
          actually broke without digging through server logs. */}
      {process.env.NODE_ENV !== "production" && error?.message && (
        <pre className="max-w-full overflow-auto whitespace-pre-wrap rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-start text-[11px] font-mono text-destructive">
          {error.message}
        </pre>
      )}
      {error?.digest && (
        <p className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
          {error.digest}
        </p>
      )}

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        {reset && (
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCw className="size-4" aria-hidden />
            {t("retry")}
          </button>
        )}
        <a
          href={mailto}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Mail className="size-4" aria-hidden />
          {t("contact")}
        </a>
        {secondaryHref && secondaryLabel && (
          <a
            href={secondaryHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {secondaryLabel}
          </a>
        )}
      </div>
    </div>
  );
}
