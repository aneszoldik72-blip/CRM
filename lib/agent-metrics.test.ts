import { describe, expect, it } from "vitest";

import {
  computeAgentMetrics,
  confirmationRate,
  effectiveRate,
  noAnswer,
  rankAgents,
  sumTotals,
  tierFor,
  trendDelta,
  type ConfirmationTotals,
} from "./agent-metrics";

const ZERO: ConfirmationTotals = { called: 0, confirmed: 0, rejected: 0 };

describe("confirmationRate", () => {
  it("returns null when called is zero", () => {
    expect(confirmationRate(ZERO)).toBeNull();
  });

  it("computes confirmed / called", () => {
    expect(confirmationRate({ called: 100, confirmed: 70, rejected: 20 })).toBe(
      0.7,
    );
  });

  it("returns null when called is negative (defensive)", () => {
    expect(
      confirmationRate({ called: -1, confirmed: 0, rejected: 0 }),
    ).toBeNull();
  });
});

describe("noAnswer", () => {
  it("subtracts confirmed and rejected from called", () => {
    expect(noAnswer({ called: 50, confirmed: 30, rejected: 10 })).toBe(10);
  });

  it("clamps to zero when inconsistent data sneaks in", () => {
    expect(noAnswer({ called: 10, confirmed: 7, rejected: 5 })).toBe(0);
  });
});

describe("effectiveRate", () => {
  it("ignores no-answer calls", () => {
    // 50 called, 10 no-ans → 40 reached; 30 confirmed → 75 %
    expect(effectiveRate({ called: 50, confirmed: 30, rejected: 10 })).toBe(
      0.75,
    );
  });

  it("returns null when nobody actually picked up", () => {
    expect(effectiveRate({ called: 5, confirmed: 0, rejected: 0 })).toBeNull();
  });
});

describe("trendDelta", () => {
  it("returns the points difference", () => {
    const current = { called: 100, confirmed: 70, rejected: 20 };
    const previous = { called: 100, confirmed: 60, rejected: 20 };
    // 0.70 − 0.60 = +0.10 (10 pts up)
    expect(trendDelta(current, previous)).toBeCloseTo(0.1, 10);
  });

  it("returns null when either side has no calls", () => {
    expect(trendDelta(ZERO, { called: 10, confirmed: 5, rejected: 5 })).toBeNull();
    expect(trendDelta({ called: 10, confirmed: 5, rejected: 5 }, ZERO)).toBeNull();
  });
});

describe("sumTotals", () => {
  it("sums field-wise", () => {
    const out = sumTotals([
      { called: 10, confirmed: 5, rejected: 2 },
      { called: 20, confirmed: 12, rejected: 6 },
    ]);
    expect(out).toEqual({ called: 30, confirmed: 17, rejected: 8 });
  });

  it("returns zeros on an empty array", () => {
    expect(sumTotals([])).toEqual(ZERO);
  });
});

describe("computeAgentMetrics", () => {
  it("tones a 75% rate as good", () => {
    const m = computeAgentMetrics({
      agentId: "a",
      current: { called: 100, confirmed: 75, rejected: 20 },
      previous: ZERO,
    });
    expect(m.rate.value).toBe(0.75);
    expect(m.rate.tone).toBe("good");
  });

  it("tones a 40% rate as bad", () => {
    const m = computeAgentMetrics({
      agentId: "a",
      current: { called: 100, confirmed: 40, rejected: 50 },
      previous: ZERO,
    });
    expect(m.rate.tone).toBe("bad");
  });

  it("tones a 20% rate as critical", () => {
    const m = computeAgentMetrics({
      agentId: "a",
      current: { called: 100, confirmed: 20, rejected: 70 },
      previous: ZERO,
    });
    expect(m.rate.tone).toBe("critical");
  });

  it("renders null rate as neutral, not bad", () => {
    const m = computeAgentMetrics({
      agentId: "a",
      current: ZERO,
      previous: ZERO,
    });
    expect(m.rate.value).toBeNull();
    expect(m.rate.tone).toBe("neutral");
  });
});

describe("rankAgents", () => {
  it("sorts by confirmation rate descending", () => {
    const ranked = rankAgents([
      { agentId: "a", current: { called: 100, confirmed: 50, rejected: 30 } },
      { agentId: "b", current: { called: 100, confirmed: 80, rejected: 10 } },
      { agentId: "c", current: { called: 100, confirmed: 60, rejected: 20 } },
    ]);
    expect(ranked.map((a) => a.agentId)).toEqual(["b", "c", "a"]);
  });

  it("breaks ties by call volume (more data wins)", () => {
    const ranked = rankAgents([
      { agentId: "low-vol", current: { called: 10, confirmed: 7, rejected: 1 } },
      { agentId: "high-vol", current: { called: 100, confirmed: 70, rejected: 10 } },
    ]);
    expect(ranked[0]!.agentId).toBe("high-vol");
  });

  it("puts agents with no calls at the bottom", () => {
    const ranked = rankAgents([
      { agentId: "no-calls", current: ZERO },
      { agentId: "low-rate", current: { called: 10, confirmed: 1, rejected: 8 } },
    ]);
    expect(ranked.map((a) => a.agentId)).toEqual(["low-rate", "no-calls"]);
  });
});

describe("tierFor", () => {
  it("only crowns rank-1 when rate is materially good", () => {
    expect(tierFor(0.78, 0)).toBe("top");
    expect(tierFor(0.62, 0)).toBe("top");
    expect(tierFor(0.55, 0)).toBe("standard");  // rank 1 but mediocre rate
  });

  it("flags poor performers for review", () => {
    expect(tierFor(0.3, 1)).toBe("review");
    expect(tierFor(null, 5)).toBe("review");
  });

  it("defaults the middle to standard", () => {
    expect(tierFor(0.55, 2)).toBe("standard");
  });
});
