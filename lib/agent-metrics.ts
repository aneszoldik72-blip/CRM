// Pure metric computation for agent confirmation tracking. No React, no
// locale, no DB. Mirrors lib/metrics.ts conventions.

import type { MetricTone, MetricValue } from "@/lib/metrics";

export type ConfirmationTotals = {
  called: number;
  confirmed: number;
  rejected: number;
};

export type AgentTotals = ConfirmationTotals & {
  agentId: string;
};

export type AgentSnapshot = {
  agentId: string;
  current: ConfirmationTotals;
  previous: ConfirmationTotals;
};

export type AgentMetrics = {
  rate: MetricValue;        // confirmed / called
  effective: MetricValue;   // confirmed / (called − noAnswer)
  confirmed: MetricValue;   // count
  called: MetricValue;      // count
  rejected: MetricValue;    // count
  noAnswer: MetricValue;    // count
  trendDelta: MetricValue;  // percentage points difference
};

const ZERO: ConfirmationTotals = { called: 0, confirmed: 0, rejected: 0 };

// Confirmation rate = confirmed / called. Returns null when called == 0,
// matching the metric convention used elsewhere (render as "—").
export function confirmationRate(t: ConfirmationTotals): number | null {
  if (t.called <= 0) return null;
  return t.confirmed / t.called;
}

// Effective rate ignores "no answer" calls, isolating in-conversation
// performance. Returns null when nobody actually picked up.
export function effectiveRate(t: ConfirmationTotals): number | null {
  const reached = reachedCount(t);
  if (reached <= 0) return null;
  return t.confirmed / reached;
}

export function noAnswer(t: ConfirmationTotals): number {
  return Math.max(0, t.called - t.confirmed - t.rejected);
}

function reachedCount(t: ConfirmationTotals): number {
  return Math.max(0, t.called - noAnswer(t));
}

// Pointwise sum of multiple totals — used to aggregate per-day rows into a
// per-period snapshot.
export function sumTotals(rows: ConfirmationTotals[]): ConfirmationTotals {
  return rows.reduce<ConfirmationTotals>(
    (acc, r) => ({
      called: acc.called + r.called,
      confirmed: acc.confirmed + r.confirmed,
      rejected: acc.rejected + r.rejected,
    }),
    { ...ZERO },
  );
}

// Tone bands chosen to match COD operator intuition:
// ≥ 70 % is genuinely strong, 50–70 is acceptable, below 50 needs attention.
function toneForRate(rate: number | null): MetricTone {
  if (rate === null) return "neutral";
  if (rate >= 0.7) return "good";
  if (rate >= 0.5) return "neutral";
  if (rate >= 0.3) return "bad";
  return "critical";
}

// Trend delta = current rate − previous rate, expressed in percentage
// *points* (not relative %). Returns null when either side is missing.
export function trendDelta(
  current: ConfirmationTotals,
  previous: ConfirmationTotals,
): number | null {
  const c = confirmationRate(current);
  const p = confirmationRate(previous);
  if (c === null || p === null) return null;
  return c - p;
}

export function computeAgentMetrics(snapshot: AgentSnapshot): AgentMetrics {
  const { current, previous } = snapshot;
  const rate = confirmationRate(current);
  const eff = effectiveRate(current);
  const delta = trendDelta(current, previous);

  return {
    rate: {
      value: rate,
      kind: "percent",
      tone: toneForRate(rate),
    },
    effective: {
      value: eff,
      kind: "percent",
      tone: toneForRate(eff),
    },
    confirmed: { value: current.confirmed, kind: "count", tone: "neutral" },
    called: { value: current.called, kind: "count", tone: "neutral" },
    rejected: { value: current.rejected, kind: "count", tone: "neutral" },
    noAnswer: { value: noAnswer(current), kind: "count", tone: "neutral" },
    trendDelta: {
      value: delta,
      kind: "percent",
      tone:
        delta === null
          ? "neutral"
          : delta > 0.02
            ? "good"
            : delta < -0.02
              ? "bad"
              : "neutral",
    },
  };
}

// Stable sort by confirmation rate desc, with two tie-breakers:
//  1. agents with more calls rank higher (more data = more signal),
//  2. agents with no calls drop to the bottom (null rates).
// Agents are compared by their CURRENT period totals.
export function rankAgents<T extends { agentId: string; current: ConfirmationTotals }>(
  snapshots: T[],
): T[] {
  return [...snapshots].sort((a, b) => {
    const ra = confirmationRate(a.current);
    const rb = confirmationRate(b.current);
    if (ra === null && rb === null) return b.current.called - a.current.called;
    if (ra === null) return 1;
    if (rb === null) return -1;
    if (ra !== rb) return rb - ra;
    return b.current.called - a.current.called;
  });
}

// Builds per-agent snapshots (current + previous totals) from a flat list of
// confirmation rows. `currentFrom..currentTo` and `previousFrom..previousTo`
// are inclusive YYYY-MM-DD strings; rows outside both ranges are ignored.
export function buildSnapshots<
  R extends { agent_id: string; date: string; called: number; confirmed: number; rejected: number },
>(
  agentIds: string[],
  rows: R[],
  ranges: {
    currentFrom: string;
    currentTo: string;
    previousFrom: string;
    previousTo: string;
  },
): Record<string, AgentSnapshot> {
  const out: Record<string, AgentSnapshot> = {};
  for (const id of agentIds) {
    out[id] = { agentId: id, current: { ...ZERO }, previous: { ...ZERO } };
  }
  for (const r of rows) {
    const target = out[r.agent_id];
    if (!target) continue;
    const within =
      r.date >= ranges.currentFrom && r.date <= ranges.currentTo
        ? "current"
        : r.date >= ranges.previousFrom && r.date <= ranges.previousTo
          ? "previous"
          : null;
    if (!within) continue;
    target[within] = {
      called: target[within].called + r.called,
      confirmed: target[within].confirmed + r.confirmed,
      rejected: target[within].rejected + r.rejected,
    };
  }
  return out;
}

// Tier label used by agent cards. "top" only applies to the rank-1 agent
// when their rate is materially good — we don't crown a 30% confirmer just
// for being the least bad.
export type AgentTier = "top" | "standard" | "review";

export function tierFor(
  rate: number | null,
  rank: number,
): AgentTier {
  if (rate === null) return "review";
  if (rank === 0 && rate >= 0.6) return "top";
  if (rate < 0.4) return "review";
  return "standard";
}
