import { describe, expect, it } from "vitest";

import { computeMetrics, type MetricsInput } from "./metrics";

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
      expect(m.avgRevenuePerOrder.value).toBeNull();
      expect(m.avgRevenuePerDelivered.value).toBeNull();
      expect(m.breakEvenLead.value).toBeNull();
      expect(m.stockDaysLeft.value).toBeNull();
    });
  });

  describe("happy path", () => {
    // 100 leads → 50 orders → 30 delivered. CA = 30 × 200 MAD = 6 000 MAD.
    // Costs total 3 000 MAD. Profit = 3 000 MAD (= 300 000 cents).
    const m = computeMetrics(
      withInput({
        leads: 100,
        orders: 50,
        delivered: 30,
        revenue_cents: 600_000,
        ads_spend_cents: 200_000,
        test_spend_cents: 20_000,
        ad_account_cents: 10_000,
        product_cost_cents: 50_000,
        service_cost_cents: 15_000,
        bonus_cents: 5_000,
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
    it("delivery rate = 0.6 (good — boundary)", () => {
      expect(m.deliveryRate.value).toBeCloseTo(0.6);
      expect(m.deliveryRate.tone).toBe("good");
    });
    it("conversion = 0.5 (good)", () => {
      expect(m.conversion.value).toBe(0.5);
      expect(m.conversion.tone).toBe("good");
    });
    it("EPO = 6 000 cents (good)", () => {
      expect(m.epo.value).toBe(6_000);
      expect(m.epo.tone).toBe("good");
    });
    it("cost per delivered = 10 000 cents", () => {
      expect(m.costPerDelivered.value).toBe(10_000);
    });
    it("avg rev / order = 12 000 cents", () => {
      expect(m.avgRevenuePerOrder.value).toBe(12_000);
    });
    it("avg rev / delivered = 20 000 cents", () => {
      expect(m.avgRevenuePerDelivered.value).toBe(20_000);
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
    it("EPO is negative / bad", () => {
      expect(m.epo.value).toBe(-2_000);
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

    function deliveryOf(orders: number, delivered: number) {
      return computeMetrics(withInput({ orders, delivered })).deliveryRate;
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

  describe("stock days left", () => {
    function stockOf(input: Partial<MetricsInput>) {
      return computeMetrics(withInput(input)).stockDaysLeft;
    }
    it("null when current_stock is null", () => {
      expect(stockOf({ delivered: 30, daysElapsed: 10 }).value).toBeNull();
    });
    it("null when delivered is 0", () => {
      expect(
        stockOf({ current_stock: 100, delivered: 0, daysElapsed: 10 }).value,
      ).toBeNull();
    });
    it("null when daysElapsed is 0", () => {
      expect(
        stockOf({ current_stock: 100, delivered: 30, daysElapsed: 0 }).value,
      ).toBeNull();
    });
    it("null when daysElapsed is null", () => {
      expect(
        stockOf({ current_stock: 100, delivered: 30, daysElapsed: null }).value,
      ).toBeNull();
    });
    it("14 days = good (boundary)", () => {
      // stock=140, delivered=10, days=1 → rate=10/d → 14 days left
      const s = stockOf({ current_stock: 140, delivered: 10, daysElapsed: 1 });
      expect(s.value).toBe(14);
      expect(s.tone).toBe("good");
    });
    it("13 days = neutral", () => {
      const s = stockOf({ current_stock: 130, delivered: 10, daysElapsed: 1 });
      expect(s.value).toBe(13);
      expect(s.tone).toBe("neutral");
    });
    it("6 days = bad", () => {
      const s = stockOf({ current_stock: 60, delivered: 10, daysElapsed: 1 });
      expect(s.tone).toBe("bad");
    });
    it("2 days = critical", () => {
      const s = stockOf({ current_stock: 20, delivered: 10, daysElapsed: 1 });
      expect(s.tone).toBe("critical");
    });
  });

  describe("break-even lead", () => {
    it("null when leads = 0", () => {
      expect(computeMetrics(ZERO).breakEvenLead.value).toBeNull();
    });
    it("can be negative when non-ads costs exceed revenue", () => {
      const m = computeMetrics(
        withInput({
          leads: 10,
          revenue_cents: 100,
          product_cost_cents: 200,
        }),
      );
      expect(m.breakEvenLead.value).toBe(-10);
    });
  });

  describe("division-by-zero guards", () => {
    it("orders = 0 nulls four metrics", () => {
      const m = computeMetrics(withInput({ leads: 5, orders: 0 }));
      expect(m.deliveryRate.value).toBeNull();
      expect(m.conversion.value).toBe(0); // orders/leads = 0
      expect(m.epo.value).toBeNull();
      expect(m.avgRevenuePerOrder.value).toBeNull();
    });
    it("delivered = 0 nulls two metrics", () => {
      const m = computeMetrics(withInput({ orders: 5, delivered: 0 }));
      expect(m.costPerDelivered.value).toBeNull();
      expect(m.avgRevenuePerDelivered.value).toBeNull();
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
});
