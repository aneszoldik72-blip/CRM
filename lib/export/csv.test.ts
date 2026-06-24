import { describe, expect, it } from "vitest";

import {
  buildRow,
  FULL_COLUMNS,
  KPI_COLUMNS,
  filenameFor,
  toCsv,
} from "./csv";

const SAMPLE_ENTRY = {
  leads: 100,
  orders: 25,
  delivered: 18,
  revenue_cents: 540_000,        // 5,400.00
  ads_spend_cents: 200_000,      // 2,000.00
  test_spend_cents: 0,
  ad_account_cents: 0,
  product_cost_cents: 80_000,    // 800.00
  service_cost_cents: 36_000,    // 360.00
  bonus_cents: 9_000,            // 90.00
};

describe("buildRow", () => {
  it("emits Latin-decimal money values, not cents", () => {
    const row = buildRow({
      productName: "Slim Fit Tee",
      yyyymm: "2026-10",
      currency: "MAD",
      entry: SAMPLE_ENTRY,
    });
    expect(row.Revenue).toBe(5400);
    // product (800/unit × 18) + service (360/unit × 18) = 20 880; plus
    // ads 2000 + bonus 90 = 22 970.
    expect(row["Total Spend"]).toBe(22_970);
    expect(row["Net Profit"]).toBe(-17_570); // 5400 − 22 970
  });

  it("emits ratios as percentage numbers (not 0.xx)", () => {
    const row = buildRow({
      productName: "Slim Fit Tee",
      yyyymm: "2026-10",
      currency: "MAD",
      entry: SAMPLE_ENTRY,
    });
    // -17 570 / 5 400 = -3.2537… → -325.37%
    expect(row["Margin %"]).toBe(-325.37);
    // 18 / 100 = 0.18 → 18.00% (delivered / leads)
    expect(row["Delivery Rate"]).toBe(18);
  });

  it("ROAS uses a multiplier, two decimals", () => {
    const row = buildRow({
      productName: "Slim Fit Tee",
      yyyymm: "2026-10",
      currency: "MAD",
      entry: SAMPLE_ENTRY,
    });
    // 5400 / 2000 = 2.70
    expect(row.ROAS).toBe(2.7);
  });

  it("emits zeros for counts and null metrics when entry is missing", () => {
    const row = buildRow({
      productName: "Diffuseur",
      yyyymm: "2026-09",
      currency: "EUR",
      entry: null,
    });
    expect(row.Leads).toBe(0);
    expect(row.Confirmed).toBe(0);
    expect(row.Revenue).toBe(0);
    expect(row.ROAS).toBeNull();
    expect(row["Margin %"]).toBeNull();
    expect(row["Delivery Rate"]).toBeNull();
    expect(row["Profit per delivery"]).toBeNull();
  });

  it("formats the Month column with the given locale", () => {
    const frRow = buildRow(
      { productName: "X", yyyymm: "2026-10", currency: "MAD", entry: null },
      "fr-FR",
    );
    const enRow = buildRow(
      { productName: "X", yyyymm: "2026-10", currency: "MAD", entry: null },
      "en-US",
    );
    expect(frRow.Month).toMatch(/Octobre/);
    expect(enRow.Month).toMatch(/October/);
  });
});

describe("toCsv", () => {
  const row = buildRow({
    productName: "Slim Fit Tee",
    yyyymm: "2026-10",
    currency: "MAD",
    entry: SAMPLE_ENTRY,
  });

  it("prepends a UTF-8 BOM for Excel", () => {
    const csv = toCsv([row], "full");
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("emits the full header set in declaration order", () => {
    const csv = toCsv([row], "full");
    const header = csv.slice(1).split(/\r?\n/, 1)[0]!;
    expect(header).toBe(FULL_COLUMNS.join(","));
  });

  it("emits only KPI columns when include = kpis", () => {
    const csv = toCsv([row], "kpis");
    const header = csv.slice(1).split(/\r?\n/, 1)[0]!;
    expect(header).toBe(KPI_COLUMNS.join(","));
    // ROAS is in both; Delivery Rate only in full.
    expect(header).not.toMatch(/Delivery Rate/);
  });

  it("renders null metrics as empty cells (not the literal 'null')", () => {
    const empty = buildRow({
      productName: "Diffuseur",
      yyyymm: "2026-09",
      currency: "EUR",
      entry: null,
    });
    const csv = toCsv([empty], "full");
    const dataLine = csv.slice(1).split(/\r?\n/)[1]!;
    expect(dataLine).not.toMatch(/null/i);
    // Final 4 columns (ROAS, Margin %, Delivery Rate, Profit per delivery) should be empty.
    const trailing = dataLine.split(",").slice(-4);
    expect(trailing).toEqual(["", "", "", ""]);
  });
});

describe("filenameFor", () => {
  it("formats as brand-export-YYYY-MM-DD.csv", () => {
    expect(filenameFor(new Date(Date.UTC(2026, 5, 14)))).toBe(
      "voidcraft-export-2026-06-14.csv",
    );
  });

  it("respects a custom brand", () => {
    expect(filenameFor(new Date(Date.UTC(2026, 11, 1)), "acme")).toBe(
      "acme-export-2026-12-01.csv",
    );
  });
});
