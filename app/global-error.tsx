"use client";

// Top-level error boundary. Required by Next.js — fires when the root
// layout itself throws, before any locale or app shell exists. Must include
// <html><body> because it replaces the root layout entirely.
//
// Copy is intentionally English-only here: next-intl isn't loaded yet, so
// we can't use translations. Keep it short and recognizable.

import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(220, 38, 38, 0.12)",
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#a3a3a3", margin: 0 }}>
            The app hit a fatal error. Reload the page, or contact us if it
            keeps happening.
          </p>
          {error?.digest && (
            <p
              style={{
                fontSize: 11,
                fontFamily: "ui-monospace, monospace",
                color: "#737373",
                background: "#1f1f1f",
                padding: "4px 10px",
                borderRadius: 6,
              }}
            >
              {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                height: 44,
                padding: "0 20px",
                borderRadius: 10,
                background: "#8b6bff",
                color: "#fff",
                border: "none",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="mailto:support@voidcraft.app"
              style={{
                height: 44,
                padding: "0 20px",
                borderRadius: 10,
                background: "transparent",
                color: "#fafafa",
                border: "1px solid #404040",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Contact support
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
