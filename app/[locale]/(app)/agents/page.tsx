import { listAgents } from "@/lib/db/agents";
import { listConfirmationsRange } from "@/lib/db/confirmations";
import { buildSnapshots } from "@/lib/agent-metrics";
import { AgentsClient } from "@/components/agents/agents-client";

// Current period = last 30 days; previous period = the 30 before that. Used
// to compute the trend chip on each card.
function periodBounds(today = new Date()) {
  const day = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate(),
    ).padStart(2, "0")}`;
  const t = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const ago = (n: number) => {
    const d = new Date(t);
    d.setUTCDate(d.getUTCDate() - n);
    return d;
  };
  return {
    currentFrom: day(ago(29)),
    currentTo: day(t),
    previousFrom: day(ago(59)),
    previousTo: day(ago(30)),
  };
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await searchParams; // route reads ?status= via client component

  const ranges = periodBounds();

  const [agents, rows] = await Promise.all([
    listAgents("all"),
    listConfirmationsRange({
      from: ranges.previousFrom,
      to: ranges.currentTo,
    }),
  ]);

  const snapshotByAgentId = buildSnapshots(
    agents.map((a) => a.id),
    rows,
    ranges,
  );

  return (
    <AgentsClient
      initialAgents={agents}
      snapshotByAgentId={snapshotByAgentId}
    />
  );
}
