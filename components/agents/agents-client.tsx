"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  createAgentAction,
  setAgentActiveAction,
  updateAgentAction,
} from "@/app/[locale]/(app)/agents/actions";
import type { AgentRow } from "@/lib/db/agents";
import {
  rankAgents,
  type AgentSnapshot,
} from "@/lib/agent-metrics";
import { AddAgentDialog } from "@/components/agents/add-agent-dialog";
import { AgentCard } from "@/components/agents/agent-card";
import { AgentEmptyState } from "@/components/agents/agent-empty-state";
import { Leaderboard } from "@/components/agents/leaderboard";
import { Button } from "@/components/ui/button";
import type { AgentInput } from "@/lib/validators/agent";

export type AgentsClientProps = {
  initialAgents: AgentRow[];
  snapshotByAgentId: Record<string, AgentSnapshot>;
};

type Status = "active" | "archived" | "all";

type OptimisticAction =
  | { type: "add"; agent: AgentRow }
  | { type: "update"; agent: AgentRow }
  | { type: "toggleActive"; id: string };

export function AgentsClient({
  initialAgents,
  snapshotByAgentId,
}: AgentsClientProps) {
  const t = useTranslations("agents");
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const status: Status =
    statusParam === "archived" || statusParam === "all"
      ? statusParam
      : "active";

  const [optimisticAgents, applyOptimistic] = useOptimistic<
    AgentRow[],
    OptimisticAction
  >(initialAgents, (state, action) => {
    switch (action.type) {
      case "add":
        return [action.agent, ...state];
      case "update":
        return state.map((a) => (a.id === action.agent.id ? action.agent : a));
      case "toggleActive":
        return state.map((a) =>
          a.id === action.id ? { ...a, active: !a.active } : a,
        );
    }
  });

  const [, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AgentRow | null>(null);

  const filtered = useMemo(() => {
    if (status === "active") return optimisticAgents.filter((a) => a.active);
    if (status === "archived")
      return optimisticAgents.filter((a) => !a.active);
    return optimisticAgents;
  }, [optimisticAgents, status]);

  const ranked = useMemo(() => {
    const snapshots = filtered
      .filter((a) => a.active)
      .map((a) => ({
        agent: a,
        snapshot: snapshotByAgentId[a.id] ?? {
          agentId: a.id,
          current: { called: 0, confirmed: 0, rejected: 0 },
          previous: { called: 0, confirmed: 0, rejected: 0 },
        },
      }));
    // rankAgents accepts AgentSnapshot[]; we wrap in objects that carry both.
    const sorted = rankAgents(
      snapshots.map((s) => ({
        agentId: s.agent.id,
        current: s.snapshot.current,
        agent: s.agent,
        snapshot: s.snapshot,
      })),
    );
    return sorted.map((s) => ({ agent: s.agent, snapshot: s.snapshot }));
  }, [filtered, snapshotByAgentId]);

  const topThree = ranked.slice(0, 3);

  function handleAdd(values: AgentInput) {
    return new Promise<Awaited<ReturnType<typeof createAgentAction>>>(
      (resolve) => {
        startTransition(async () => {
          const temp: AgentRow = {
            id: `temp-${crypto.randomUUID()}`,
            user_id: "",
            name: values.name,
            phone: values.phone ?? null,
            photo_url: values.photo_url ?? null,
            active: true,
            created_at: new Date().toISOString(),
          };
          applyOptimistic({ type: "add", agent: temp });
          const res = await createAgentAction(values);
          if (res.ok) {
            toast.success(t("toast.added"));
          } else if (res.serverError) {
            toast.error(res.serverError);
          }
          resolve(res);
        });
      },
    );
  }

  function handleEdit(values: AgentInput) {
    if (!editTarget) {
      return Promise.resolve({ ok: false } as const);
    }
    const target = editTarget;
    return new Promise<Awaited<ReturnType<typeof updateAgentAction>>>(
      (resolve) => {
        startTransition(async () => {
          const res = await updateAgentAction(target.id, values);
          if (res.ok && res.agent) {
            applyOptimistic({ type: "update", agent: res.agent });
            toast.success(t("toast.updated"));
          } else if (res.serverError) {
            toast.error(res.serverError);
          }
          resolve(res);
        });
      },
    );
  }

  function handleArchiveToggle(agent: AgentRow) {
    startTransition(async () => {
      applyOptimistic({ type: "toggleActive", id: agent.id });
      const res = await setAgentActiveAction(agent.id, !agent.active);
      if (res.ok) {
        toast.success(
          agent.active ? t("toast.archived") : t("toast.unarchived"),
        );
      } else if (res.serverError) {
        toast.error(res.serverError);
      }
    });
  }

  const isEmptyOverall = optimisticAgents.length === 0;

  if (isEmptyOverall) {
    return (
      <>
        <AgentEmptyState onAdd={() => setAddOpen(true)} />
        <AddAgentDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onSubmit={handleAdd}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <StatusTabs status={status} />
          <Button
            type="button"
            onClick={() => setAddOpen(true)}
            className="h-10 gap-2 px-4"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("addAgent")}</span>
            <span className="sm:hidden">{t("addAgentShort")}</span>
          </Button>
        </div>
      </header>

      {topThree.length > 0 && status === "active" && (
        <Leaderboard topAgents={topThree} variant="podium" />
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {status === "archived" ? t("filtered.noArchived") : t("filtered.noForFilter")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {ranked.map(({ agent, snapshot }, i) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              snapshot={snapshot}
              rank={i}
              onEdit={(target) => setEditTarget(target)}
              onArchiveToggle={handleArchiveToggle}
            />
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        aria-label={t("addAgent")}
        className="fixed bottom-20 end-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 sm:hidden"
      >
        <Plus className="size-6" />
      </button>

      <AddAgentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
      />
      <AddAgentDialog
        mode="edit"
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        defaultValues={
          editTarget
            ? {
                name: editTarget.name,
                phone: editTarget.phone,
                photo_url: editTarget.photo_url,
              }
            : undefined
        }
        onSubmit={handleEdit}
      />
    </div>
  );
}

function StatusTabs({ status }: { status: Status }) {
  const t = useTranslations("agents.filter");
  return (
    <div
      role="tablist"
      className="inline-flex rounded-lg border border-border bg-card p-1 text-sm"
    >
      <Tab status={status} value="active" label={t("active")} />
      <Tab status={status} value="archived" label={t("archived")} />
      <Tab status={status} value="all" label={t("all")} />
    </div>
  );
}

function Tab({
  status,
  value,
  label,
}: {
  status: Status;
  value: Status;
  label: string;
}) {
  const active = status === value;
  const href = value === "active" ? "/agents" : `/agents?status=${value}`;
  return (
    <a
      href={href}
      role="tab"
      aria-selected={active}
      className={cn(
        "rounded-md px-3 py-1.5 transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </a>
  );
}
