import { listAgents } from "@/lib/db/agents";
import { listConfirmationsRange } from "@/lib/db/confirmations";
import { buildSnapshots } from "@/lib/agent-metrics";
import { AgentsClient } from "@/components/agents/agents-client";

// Current period = this calendar month (1st through today).
// Previous period = the entire previous calendar month.
// The widget compares the two; agents that haven't logged this month show
// "—" until they do.
function periodBounds(today = new Date()) {
  const day = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate(),
    ).padStart(2, "0")}`;
  const t = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const monthStart = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
  const prevMonthStart = new Date(
    Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1),
  );
  const prevMonthEnd = new Date(
    Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0),
  );
  return {
    currentFrom: day(monthStart),
    currentTo: day(t),
    previousFrom: day(prevMonthStart),
    previousTo: day(prevMonthEnd),
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
