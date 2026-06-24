import { describe, expect, it } from "vitest";

import {
  aggregateEntries,
  computeMetrics,
  computeNetProfitCents,
  type MetricsInput,
} from "./metrics";

const ZERO: MetricsInput = {
  leads: 0,
  orders: 0,
  delivered: 0,
  revenue_cents: 0,
  ads_spend_cents: 0,
  test_spend_cents: 0,
  ad_account_cents: 0,
  product_cost_cents: 0,
  service_cost_cents: 0,
  bonus_cents: 0,
  initial_stock: null,
  current_stock: null,
  daysElapsed: null,
};

function withInput(overrides: Partial<MetricsInput>): MetricsInput {
  return { ...ZERO, ...overrides };
}

describe("computeMetrics", () => {
  describe("all-zero input", () => {
    const m = computeMetrics(ZERO);
    it("net profit is 0 / neutral", () => {
      expect(m.netProfit.value).toBe(0);
      expect(m.netProfit.tone).toBe("neutral");
    });
    it("total spend is 0 / neutral", () => {
      expect(m.totalSpend.value).toBe(0);
      expect(m.totalSpend.tone).toBe("neutral");
    });
    it("everything else is null", () => {
      expect(m.roas.value).toBeNull();
      expect(m.margin.value).toBeNull();
      expect(m.deliveryRate.value).toBeNull();
      expect(m.conversion.value).toBeNull();
      expect(m.epo.value).toBeNull();
      expect(m.costPerDelivered.value).toBeNull();
      expect(m.breakEvenLead.value).toBeNull();
      expect(m.stockDaysLeft.value).toBeNull();
    });
  });

  describe("happy path", () => {
    // 100 leads → 50 orders → 30 delivered. CA = 30 × 200 MAD = 6 000 MAD.
    // Costs total 3 000 MAD. Profit = 3 000 MAD (= 300 000 cents).
    // product_cost_cents and service_cost_cents are per-unit; total
    // contributions are 2 000 × 30 = 60 000 and 1 000 × 30 = 30 000.
    const m = computeMetrics(
      withInput({
        leads: 100,
        orders: 50,
        delivered: 30,
        revenue_cents: 600_000,
        ads_spend_cents: 200_000,
        test_spend_cents: 10_000,
        ad_account_cents: 0,
        product_cost_cents: 2_000,
        service_cost_cents: 1_000,
        bonus_cents: 0,
      }),
    );

    it("net profit", () => {
      expect(m.netProfit.value).toBe(300_000);
      expect(m.netProfit.tone).toBe("good");
    });
    it("total spend", () => {
      expect(m.totalSpend.value).toBe(300_000);
    });
    it("ROAS = 3 (good)", () => {
      expect(m.roas.value).toBe(3);
      expect(m.roas.tone).toBe("good");
    });
    it("margin = 0.5 (good)", () => {
      expect(m.margin.value).toBe(0.5);
      expect(m.margin.tone).toBe("good");
    });
    it("delivery rate = 0.3 (bad — delivered/leads)", () => {
      expect(m.deliveryRate.value).toBeCloseTo(0.3);
      expect(m.deliveryRate.tone).toBe("bad");
    });
    it("conversion = 0.5 (good)", () => {
      expect(m.conversion.value).toBe(0.5);
      expect(m.conversion.tone).toBe("good");
    });
    it("profit per delivery = 10 000 cents (good)", () => {
      expect(m.epo.value).toBe(10_000);
      expect(m.epo.tone).toBe("good");
    });
    it("cost per delivered = 10 000 cents", () => {
      expect(m.costPerDelivered.value).toBe(10_000);
    });
    it("break-even lead = (revenue − non-ads costs) / leads", () => {
      // (600 000 − 100 000) / 100 = 5 000 cents per lead
      expect(m.breakEvenLead.value).toBe(5_000);
    });
  });

  describe("negative profit", () => {
    const m = computeMetrics(
      withInput({
        leads: 100,
        orders: 50,
        delivered: 30,
        revenue_cents: 100_000,
        ads_spend_cents: 200_000,
      }),
    );
    it("net profit is negative / bad", () => {
      expect(m.netProfit.value).toBe(-100_000);
      expect(m.netProfit.tone).toBe("bad");
    });
    it("profit per delivery is negative / bad", () => {
      expect(m.epo.value).toBeCloseTo(-100_000 / 30);
      expect(m.epo.tone).toBe("bad");
    });
    it("margin is negative / bad", () => {
      expect(m.margin.value).toBe(-1);
      expect(m.margin.tone).toBe("bad");
    });
    it("ROAS = 0.5 / bad", () => {
      expect(m.roas.value).toBe(0.5);
      expect(m.roas.tone).toBe("bad");
    });
  });

  describe("threshold boundaries", () => {
    function roasOf(revenue: number, ads: number) {
      return computeMetrics(
        withInput({ revenue_cents: revenue, ads_spend_cents: ads }),
      ).roas;
    }
    it("ROAS < 1 is bad", () => {
      expect(roasOf(99, 100).tone).toBe("bad");
    });
    it("ROAS = 1 is neutral", () => {
      expect(roasOf(100, 100).tone).toBe("neutral");
    });
    it("ROAS = 1.99 is neutral", () => {
      expect(roasOf(199, 100).tone).toBe("neutral");
    });
    it("ROAS = 2 is good", () => {
      expect(roasOf(200, 100).tone).toBe("good");
    });

    function marginOf(revenue: number, costs: number) {
      return computeMetrics(
        withInput({ revenue_cents: revenue, ads_spend_cents: costs }),
      ).margin;
    }
    it("margin < 10% is bad", () => {
      // revenue=1000, costs=901 → profit=99 → margin=0.099
      expect(marginOf(1000, 901).tone).toBe("bad");
    });
    it("margin = 10% is neutral", () => {
      expect(marginOf(1000, 900).tone).toBe("neutral");
    });
    it("margin = 20% is good", () => {
      expect(marginOf(1000, 800).tone).toBe("good");
    });

    function deliveryOf(leads: number, delivered: number) {
      return computeMetrics(withInput({ leads, delivered })).deliveryRate;
    }
    it("delivery 39% is bad", () => {
      expect(deliveryOf(100, 39).tone).toBe("bad");
    });
    it("delivery 40% is neutral", () => {
      expect(deliveryOf(100, 40).tone).toBe("neutral");
    });
    it("delivery 60% is good", () => {
      expect(deliveryOf(100, 60).tone).toBe("good");
    });

    function conversionOf(leads: number, orders: number) {
      return computeMetrics(withInput({ leads, orders })).conversion;
    }
    it("conversion 4% is bad", () => {
      expect(conversionOf(100, 4).tone).toBe("bad");
    });
    it("conversion 5% is neutral", () => {
      expect(conversionOf(100, 5).tone).toBe("neutral");
    });
    it("conversion 20% is good", () => {
      expect(conversionOf(100, 20).tone).toBe("good");
    });
  });

  describe("stock units left", () => {
    function stockOf(input: Partial<MetricsInput>) {
      return computeMetrics(withInput(input)).stockDaysLeft;
    }
    it("null when current_stock is null", () => {
      expect(stockOf({ delivered: 30, daysElapsed: 10 }).value).toBeNull();
    });
    it("shows units with neutral tone when delivered is 0", () => {
      const s = stockOf({ current_stock: 100, delivered: 0, daysElapsed: 10 });
      expect(s.value).toBe(100);
      expect(s.tone).toBe("neutral");
    });
    it("shows units with neutral tone when daysElapsed is 0", () => {
      const s = stockOf({ current_stock: 100, delivered: 30, daysElapsed: 0 });
      expect(s.value).toBe(100);
      expect(s.tone).toBe("neutral");
    });
    it("shows units with neutral tone when daysElapsed is null", () => {
      const s = stockOf({
        current_stock: 100,
        delivered: 30,
        daysElapsed: null,
      });
      expect(s.value).toBe(100);
      expect(s.tone).toBe("neutral");
    });
    it("14 days implied = good (boundary)", () => {
      // stock=140, delivered=10, days=1 → rate=10/d → 14 days left
      const s = stockOf({ current_stock: 140, delivered: 10, daysElapsed: 1 });
      expect(s.value).toBe(140);
      expect(s.tone).toBe("good");
    });
    it("13 days implied = neutral", () => {
      const s = stockOf({ current_stock: 130, delivered: 10, daysElapsed: 1 });
      expect(s.value).toBe(130);
      expect(s.tone).toBe("neutral");
    });
    it("6 days implied = bad", () => {
      const s = stockOf({ current_stock: 60, delivered: 10, daysElapsed: 1 });
      expect(s.value).toBe(60);
      expect(s.tone).toBe("bad");
    });
    it("2 days implied = critical", () => {
      const s = stockOf({ current_stock: 20, delivered: 10, daysElapsed: 1 });
      expect(s.value).toBe(20);
      expect(s.tone).toBe("critical");
    });
  });

  describe("break-even lead", () => {
    it("null when leads = 0", () => {
      expect(computeMetrics(ZERO).breakEvenLead.value).toBeNull();
    });
    it("can be negative when non-ads costs exceed revenue", () => {
      // product_cost is per-unit; with delivered=1, contribution = 200.
      const m = computeMetrics(
        withInput({
          leads: 10,
          delivered: 1,
          revenue_cents: 100,
          product_cost_cents: 200,
        }),
      );
      expect(m.breakEvenLead.value).toBe(-10);
    });
  });

  describe("division-by-zero guards", () => {
    it("leads = 0 nulls deliveryRate, conversion, breakEvenLead", () => {
      const m = computeMetrics(withInput({ leads: 0, orders: 5 }));
      expect(m.deliveryRate.value).toBeNull();
      expect(m.conversion.value).toBeNull();
      expect(m.breakEvenLead.value).toBeNull();
    });
    it("orders = 0 still computes conversion as 0", () => {
      const m = computeMetrics(withInput({ leads: 5, orders: 0 }));
      expect(m.conversion.value).toBe(0); // orders/leads = 0
    });
    it("delivered = 0 nulls epo and costPerDelivered", () => {
      const m = computeMetrics(withInput({ orders: 5, delivered: 0 }));
      expect(m.epo.value).toBeNull();
      expect(m.costPerDelivered.value).toBeNull();
    });
    it("ads_spend = 0 nulls ROAS", () => {
      const m = computeMetrics(withInput({ revenue_cents: 1000 }));
      expect(m.roas.value).toBeNull();
    });
    it("revenue = 0 nulls margin", () => {
      const m = computeMetrics(withInput({ ads_spend_cents: 1000 }));
      expect(m.margin.value).toBeNull();
    });
  });

  describe("per-unit cost scaling", () => {
    it("totalSpend scales product_cost and service_cost by delivered", () => {
      // delivered=40, product=100/unit (=4000), service=100/unit (=4000).
      // Total contribution from product+service = 8000 cents.
      const m = computeMetrics(
        withInput({
          delivered: 40,
          product_cost_cents: 100,
          service_cost_cents: 100,
        }),
      );
      expect(m.totalSpend.value).toBe(8000);
    });

    it("totalSpend would be 200 under the old (buggy) flat-sum formula", () => {
      // Sanity guard: confirms we are NOT regressing to the old behaviour.
      const m = computeMetrics(
        withInput({
          delivered: 40,
          product_cost_cents: 100,
          service_cost_cents: 100,
        }),
      );
      expect(m.totalSpend.value).not.toBe(200);
    });

    it("delivered=0 → product/service contribute nothing to totalSpend", () => {
      const m = computeMetrics(
        withInput({
          delivered: 0,
          product_cost_cents: 500,
          service_cost_cents: 500,
          ads_spend_cents: 100,
        }),
      );
      expect(m.totalSpend.value).toBe(100);
    });
  });
});

describe("computeNetProfitCents", () => {
  it("scales product/service by delivered", () => {
    // delivered=40, revenue=10_000, ads=1_000, product=100/unit, service=100/unit.
    // Net = 10_000 − (1_000 + 40×100 + 40×100) = 10_000 − 9_000 = 1_000.
    const profit = computeNetProfitCents({
      delivered: 40,
      revenue_cents: 10_000,
      ads_spend_cents: 1_000,
      test_spend_cents: 0,
      ad_account_cents: 0,
      product_cost_cents: 100,
      service_cost_cents: 100,
      bonus_cents: 0,
    });
    expect(profit).toBe(1_000);
  });
});

describe("aggregateEntries", () => {
  type Agg = Omit<MetricsInput, "daysElapsed">;
  const ZERO_AGG: Agg = (() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { daysElapsed: _drop, ...rest } = ZERO;
    return rest;
  })();
  const withAgg = (overrides: Partial<Agg>): Agg => ({
    ...ZERO_AGG,
    ...overrides,
  });

  it("preserves Σ(per_unit_cost × delivered) for product and service", () => {
    // Entry A: delivered=10, product=100/u, service=50/u
    //   → contribution: product=1000, service=500
    // Entry B: delivered=30, product=200/u, service=80/u
    //   → contribution: product=6000, service=2400
    // Grand totals: product=7000, service=2900, delivered=40
    const agg = aggregateEntries([
      withAgg({ delivered: 10, product_cost_cents: 100, service_cost_cents: 50 }),
      withAgg({ delivered: 30, product_cost_cents: 200, service_cost_cents: 80 }),
    ]);
    expect(agg.delivered).toBe(40);
    expect(agg.product_cost_cents * agg.delivered).toBe(7000);
    expect(agg.service_cost_cents * agg.delivered).toBe(2900);
  });

  it("flat-summed fields aggregate by simple addition", () => {
    const agg = aggregateEntries([
      withAgg({
        leads: 100,
        orders: 50,
        revenue_cents: 1_000,
        ads_spend_cents: 200,
        test_spend_cents: 10,
        ad_account_cents: 5,
        bonus_cents: 3,
      }),
      withAgg({
        leads: 50,
        orders: 25,
        revenue_cents: 500,
        ads_spend_cents: 100,
        test_spend_cents: 5,
        ad_account_cents: 2,
        bonus_cents: 1,
      }),
    ]);
    expect(agg.leads).toBe(150);
    expect(agg.orders).toBe(75);
    expect(agg.revenue_cents).toBe(1_500);
    expect(agg.ads_spend_cents).toBe(300);
    expect(agg.test_spend_cents).toBe(15);
    expect(agg.ad_account_cents).toBe(7);
    expect(agg.bonus_cents).toBe(4);
  });

  it("Σ delivered = 0 → per-unit cost averaged to 0 (no NaN)", () => {
    const agg = aggregateEntries([
      withAgg({ delivered: 0, product_cost_cents: 500, service_cost_cents: 200 }),
      withAgg({ delivered: 0, product_cost_cents: 100, service_cost_cents: 50 }),
    ]);
    expect(agg.delivered).toBe(0);
    expect(agg.product_cost_cents).toBe(0);
    expect(agg.service_cost_cents).toBe(0);
  });

  it("aggregated totalSpend through computeMetrics matches per-entry sum", () => {
    const eA = withAgg({
      leads: 100,
      orders: 50,
      delivered: 10,
      revenue_cents: 1_000,
      ads_spend_cents: 200,
      product_cost_cents: 100, // ×10 = 1000
      service_cost_cents: 50, // ×10 = 500
    });
    const eB = withAgg({
      leads: 50,
      orders: 25,
      delivered: 30,
      revenue_cents: 3_000,
      ads_spend_cents: 500,
      product_cost_cents: 200, // ×30 = 6000
      service_cost_cents: 80, // ×30 = 2400
    });
    const mA = computeMetrics({ ...eA, daysElapsed: null });
    const mB = computeMetrics({ ...eB, daysElapsed: null });
    const sumSpend = (mA.totalSpend.value ?? 0) + (mB.totalSpend.value ?? 0);

    const agg = aggregateEntries([eA, eB]);
    const aggMetrics = computeMetrics({ ...agg, daysElapsed: null });
    expect(aggMetrics.totalSpend.value).toBe(sumSpend);
  });
});
