"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CloudOff,
  Loader2,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type SaveState =
  | { kind: "idle" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "offline" }
  | { kind: "error"; onRetry?: () => void };

function formatAgo(seconds: number): string {
  if (seconds < 5) return "à l'instant";
  if (seconds < 60) return `il y a ${seconds} s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  return `il y a ${h} h`;
}

export function SaveIndicator({ state }: { state: SaveState }) {
  const [, force] = useState(0);

  // Re-render every 15s so the "il y a X" timer stays accurate.
  useEffect(() => {
    if (state.kind !== "saved") return;
    const id = setInterval(() => force((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, [state.kind]);

  if (state.kind === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs",
        state.kind === "error" || state.kind === "offline"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground",
      )}
    >
      {state.kind === "dirty" && (
        <>
          <span className="size-1.5 rounded-full bg-muted-foreground" />
          <span>Modifications non enregistrées…</span>
        </>
      )}
      {state.kind === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span>Enregistrement…</span>
        </>
      )}
      {state.kind === "saved" && (
        <>
          <Check className="size-3.5 text-emerald-500" />
          <span>
            Enregistré {formatAgo(Math.floor((Date.now() - state.at) / 1000))}
          </span>
        </>
      )}
      {state.kind === "offline" && (
        <>
          <CloudOff className="size-3.5" />
          <span>Hors ligne — réessai automatique au retour du réseau</span>
        </>
      )}
      {state.kind === "error" && (
        <>
          <TriangleAlert className="size-3.5" />
          <span>Échec de l&apos;enregistrement.</span>
          {state.onRetry && (
            <button
              type="button"
              onClick={state.onRetry}
              className="ms-1 inline-flex items-center gap-1 underline-offset-2 hover:underline"
            >
              <RefreshCcw className="size-3" /> Réessayer
            </button>
          )}
        </>
      )}
    </div>
  );
}
