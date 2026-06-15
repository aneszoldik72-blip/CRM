"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { updateProfileAction } from "@/app/[locale]/(app)/settings/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"] as const;
const TARGET = 512;

// Stages let the toast point at which step actually broke instead of
// collapsing every failure into a generic "unknown error".
type UploadStage = "init" | "session" | "resize" | "upload" | "publicUrl" | "saveProfile";

const STAGE_LABELS: Record<UploadStage, string> = {
  init: "Init",
  session: "Auth",
  resize: "Resize",
  upload: "Storage upload",
  publicUrl: "Public URL",
  saveProfile: "Save profile",
};

function stageLabel(stage: UploadStage): string {
  return STAGE_LABELS[stage];
}

// Robust error-to-string. Supabase storage errors are sometimes plain
// objects rather than Error instances, so `instanceof Error` alone would
// fall through to the generic toast.
function describeError(err: unknown): string {
  if (err instanceof Error) {
    return err.message || err.name || "Error with no message";
  }
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    const msg = obj.message ?? obj.error ?? obj.statusText;
    if (typeof msg === "string" && msg.length > 0) return msg;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

export type AvatarUploaderProps = {
  userId: string;
  initialUrl: string | null;
  fallbackInitials: string;
};

// Resizes the image client-side to 512×512 (cover crop) and re-encodes as
// PNG before upload. Keeps the bucket tidy and the bandwidth small.
async function resizeToPng(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);

  // Cover crop math is identical for both canvas kinds.
  const scale = Math.max(TARGET / bmp.width, TARGET / bmp.height);
  const w = bmp.width * scale;
  const h = bmp.height * scale;
  const dx = (TARGET - w) / 2;
  const dy = (TARGET - h) / 2;

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(TARGET, TARGET);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D canvas context.");
    ctx.drawImage(bmp, dx, dy, w, h);
    bmp.close();
    return canvas.convertToBlob({ type: "image/png" });
  }

  const canvas = document.createElement("canvas");
  canvas.width = TARGET;
  canvas.height = TARGET;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas context.");
  ctx.drawImage(bmp, dx, dy, w, h);
  bmp.close();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}

export function AvatarUploader({
  userId,
  initialUrl,
  fallbackInitials,
}: AvatarUploaderProps) {
  const t = useTranslations("settings.profile.avatar");
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!(ACCEPTED as readonly string[]).includes(file.type)) {
        toast.error(t("badType"));
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error(t("tooLarge"));
        return;
      }

      setBusy(true);
      let stage: UploadStage = "init";
      try {
        const supabase = createClient();

        // C — verify the session at upload time and use the JWT-derived uid
        // for the path. RLS checks `(storage.foldername(name))[1] = auth.uid()`;
        // if the prop somehow disagrees with the session we'd get a silent
        // policy denial. This makes the cause explicit.
        stage = "session";
        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        if (!auth.user) throw new Error("No active session");
        const uid = auth.user.id;
        if (uid !== userId) {
          // Not fatal — keep going with the session uid — but worth knowing.
          console.warn(
            "[avatar] session uid differs from prop userId; using session uid",
            { sessionUid: uid, propUserId: userId },
          );
        }

        stage = "resize";
        const blob = await resizeToPng(file);

        stage = "upload";
        const path = `${uid}/avatar.png`; // NB: no "avatars/" prefix — bucket is in .from()
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, blob, {
            upsert: true,
            contentType: "image/png",
            cacheControl: "0",
          });
        if (upErr) throw upErr;

        stage = "publicUrl";
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        if (!data?.publicUrl) throw new Error("Storage returned empty publicUrl");
        // Cache-bust so the new image replaces the cached one immediately.
        const fresh = `${data.publicUrl}?v=${Date.now()}`;

        stage = "saveProfile";
        const res = await updateProfileAction({ image_url: fresh });
        if (!res.ok) {
          throw new Error(
            res.serverError ??
              (res.fieldErrors
                ? `Validation failed: ${JSON.stringify(res.fieldErrors)}`
                : "updateProfileAction returned ok=false with no details"),
          );
        }

        setUrl(fresh);
        toast.success(t("uploadedToast"));
      } catch (err) {
        const detail = describeError(err);
        // Surface to console for full stack/object inspection.
        console.error(`[avatar] upload failed at stage="${stage}"`, err);
        toast.error(`${stageLabel(stage)}: ${detail}`);
      } finally {
        setBusy(false);
      }
    },
    [t, userId],
  );

  async function remove() {
    setBusy(true);
    let stage: UploadStage = "init";
    try {
      const supabase = createClient();

      stage = "session";
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!auth.user) throw new Error("No active session");
      const uid = auth.user.id;

      stage = "upload"; // re-using "upload" stage label; storage.remove fails here
      const path = `${uid}/avatar.png`;
      const { error: rmErr } = await supabase.storage
        .from("avatars")
        .remove([path]);
      if (rmErr) throw rmErr;

      stage = "saveProfile";
      const res = await updateProfileAction({ image_url: null });
      if (!res.ok) {
        throw new Error(
          res.serverError ?? "updateProfileAction returned ok=false",
        );
      }

      setUrl(null);
      toast.success(t("removedToast"));
    } catch (err) {
      const detail = describeError(err);
      console.error(`[avatar] remove failed at stage="${stage}"`, err);
      toast.error(`${stageLabel(stage)}: ${detail}`);
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void upload(f);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void upload(f);
  }

  return (
    <div className="flex items-center gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInput.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={t("change")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInput.current?.click();
          }
        }}
        className={cn(
          "group relative flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border bg-card transition-colors",
          dragging
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/40",
          busy && "pointer-events-none opacity-70",
        )}
      >
        {url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <span className="text-base font-semibold text-primary">
            {fallbackInitials}
          </span>
        )}

        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity",
            !busy && "group-hover:opacity-100",
          )}
        >
          <Upload className="size-5" />
        </span>

        {busy && (
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center bg-background/60"
          >
            <Loader2 className="size-5 animate-spin text-foreground" />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="text-xs text-muted-foreground">{t("dropHint")}</p>
        {url && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="inline-flex w-fit items-center gap-1 text-xs text-destructive transition-colors hover:underline disabled:opacity-50"
          >
            <X className="size-3" />
            {t("remove")}
          </button>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}
