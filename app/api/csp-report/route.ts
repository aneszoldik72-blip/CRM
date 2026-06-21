import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

// Receives Content-Security-Policy violation reports from browsers while CSP
// is in report-only mode. Browsers POST either a legacy CSP report or a
// modern Reporting API envelope — we accept both.
export const dynamic = "force-dynamic";

type CspReport = {
  "document-uri"?: string;
  "violated-directive"?: string;
  "effective-directive"?: string;
  "blocked-uri"?: string;
  "source-file"?: string;
  "line-number"?: number;
  "column-number"?: number;
  "original-policy"?: string;
};

type CspEnvelope =
  | { "csp-report": CspReport }
  | { type: "csp-violation"; body: CspReport };

export async function POST(request: NextRequest) {
  let payload: CspEnvelope | null = null;
  try {
    payload = (await request.json()) as CspEnvelope;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const report: CspReport =
    "csp-report" in payload
      ? payload["csp-report"]
      : payload.body;

  Sentry.captureMessage("CSP violation", {
    level: "warning",
    tags: {
      type: "csp-report",
      directive:
        report["effective-directive"] ?? report["violated-directive"] ?? "unknown",
    },
    extra: {
      blockedUri: report["blocked-uri"],
      documentUri: report["document-uri"],
      sourceFile: report["source-file"],
      line: report["line-number"],
      column: report["column-number"],
    },
  });

  return NextResponse.json({ ok: true }, { status: 204 });
}
