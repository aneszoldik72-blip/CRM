"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

function useFormatAgo() {
  const t = useTranslations("entries.save");
  return (seconds: number): string => {
    if (seconds < 5) return t("justNow");
    if (seconds < 60) return t("secondsAgo", { seconds });
    const m = Math.floor(seconds / 60);
    if (m < 60) return t("minutesAgo", { minutes: m });
    const h = Math.floor(m / 60);
    return t("hoursAgo", { hours: h });
  };
}

export function SaveIndicator({ state }: { state: SaveState }) {
  const t = useTranslations("entries.save");
  const formatAgo = useFormatAgo();
  const [, force] = useState(0);

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
          <span>{t("dirty")}</span>
        </>
      )}
      {state.kind === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span>{t("saving")}</span>
        </>
      )}
      {state.kind === "saved" && (
        <>
          <Check className="size-3.5 text-emerald-500" />
          <span>
            {t("saved", {
              ago: formatAgo(Math.floor((Date.now() - state.at) / 1000)),
            })}
          </span>
        </>
      )}
      {state.kind === "offline" && (
        <>
          <CloudOff className="size-3.5" />
          <span>{t("offline")}</span>
        </>
      )}
      {state.kind === "error" && (
        <>
          <TriangleAlert className="size-3.5" />
          <span>{t("error")}</span>
          {state.onRetry && (
            <button
              type="button"
              onClick={state.onRetry}
              className="ms-1 inline-flex items-center gap-1 underline-offset-2 hover:underline"
            >
              <RefreshCcw className="size-3" /> {t("retry")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
