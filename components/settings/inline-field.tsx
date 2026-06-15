"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { updateProfileAction } from "@/app/[locale]/(app)/settings/actions";
import type { ProfileUpdateInput } from "@/lib/validators/profile";
import { useResolveValidationError } from "@/lib/validation-messages";
import { Label } from "@/components/ui/label";
import { useSectionSaveState } from "./save-state-context";

const DEBOUNCE_MS = 800;

export type InlineFieldProps<K extends keyof ProfileUpdateInput> = {
  name: K;
  label: string;
  initialValue: ProfileUpdateInput[K];
  /**
   * Render the actual input. Receives the current value and an `onChange`
   * that should fire with every keystroke / selection change.
   */
  render: (args: {
    id: string;
    value: ProfileUpdateInput[K];
    onChange: (v: ProfileUpdateInput[K]) => void;
  }) => React.ReactNode;
  description?: string;
};

// Generic auto-save row. Handles per-field debounce, dirty/saving/saved
// reporting into the section context, and shared error toast + field error.
export function InlineField<K extends keyof ProfileUpdateInput>({
  name,
  label,
  initialValue,
  render,
  description,
}: InlineFieldProps<K>) {
  const tSave = useTranslations("entries.save");
  const resolveError = useResolveValidationError();
  const ctx = useSectionSaveState();

  const [value, setValue] = useState<ProfileUpdateInput[K]>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resync if the server-side value changes (e.g. after a related field
  // update triggered a revalidate). Keep local edits while in-flight.
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const save = useCallback(
    async (next: ProfileUpdateInput[K]) => {
      ctx.startSaving(name as string);
      const patch = { [name]: next } as ProfileUpdateInput;
      const res = await updateProfileAction(patch);
      if (res.ok) {
        setError(null);
        ctx.finishSaved(name as string);
      } else {
        if (res.fieldErrors?.[name as string]) {
          setError(resolveError(res.fieldErrors[name as string]!));
        } else if (res.serverError) {
          toast.error(res.serverError);
        } else {
          toast.error(tSave("toastFail"));
        }
        ctx.finishError();
      }
    },
    [name, ctx, resolveError, tSave],
  );

  function onChange(next: ProfileUpdateInput[K]) {
    setValue(next);
    ctx.startDirty(name as string);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void save(next);
    }, DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const id = `inline-${String(name)}`;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {render({ id, value, onChange })}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
