"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import type { SaveState } from "@/components/entries/save-indicator";

// Shared save-state machine for the settings inline-edit cluster. Each
// section component reports `dirty`/`saving`/`saved` per field-id and a
// single SaveIndicator at the top of the section reflects the rolled-up
// status.

type SectionSaveCtx = {
  state: SaveState;
  startDirty: (key: string) => void;
  startSaving: (key: string) => void;
  finishSaved: (key: string) => void;
  finishError: () => void;
};

const Ctx = createContext<SectionSaveCtx | null>(null);

export function SaveStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const pending = useRef(new Set<string>());
  const inFlight = useRef(new Set<string>());

  const startDirty = useCallback((key: string) => {
    pending.current.add(key);
    setState({ kind: "dirty" });
  }, []);

  const startSaving = useCallback((key: string) => {
    pending.current.delete(key);
    inFlight.current.add(key);
    setState({ kind: "saving" });
  }, []);

  const finishSaved = useCallback((key: string) => {
    inFlight.current.delete(key);
    if (pending.current.size === 0 && inFlight.current.size === 0) {
      setState({ kind: "saved", at: Date.now() });
    }
  }, []);

  const finishError = useCallback(() => {
    setState({ kind: "error" });
  }, []);

  const value = useMemo<SectionSaveCtx>(
    () => ({ state, startDirty, startSaving, finishSaved, finishError }),
    [state, startDirty, startSaving, finishSaved, finishError],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSectionSaveState(): SectionSaveCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSectionSaveState outside <SaveStateProvider>");
  return v;
}
