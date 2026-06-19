import Link from "next/link";

// Top-level 404 — fires when no locale segment matches. Plain HTML so we
// don't depend on next-intl, which only loads inside the [locale] tree.

export default function NotFound() {
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
          <p style={{ fontSize: 56, fontWeight: 600, margin: 0, lineHeight: 1 }}>
            404
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            Page not found
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#a3a3a3", margin: 0 }}>
            The link is broken or the page moved. Head back home.
          </p>
          <Link
            href="/"
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 10,
              background: "#8b6bff",
              color: "#fff",
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Back home
          </Link>
        </div>
      </body>
    </html>
  );
}
