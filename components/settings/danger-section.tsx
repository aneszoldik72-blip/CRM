"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { DELETE_CONFIRMATION_PHRASE } from "@/lib/validators/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DangerSectionProps = {
  currentEmail: string;
  counts: {
    products: number;
    agents: number;
    entries: number;
    confirmations: number;
  };
};

export function DangerSection({ currentEmail, counts }: DangerSectionProps) {
  const t = useTranslations("settings.danger");
  const [typed, setTyped] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTyped, setModalTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const phraseMatches = typed === DELETE_CONFIRMATION_PHRASE;
  const modalMatches = modalTyped === DELETE_CONFIRMATION_PHRASE;

  function deleteAccount() {
    startTransition(async () => {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation: DELETE_CONFIRMATION_PHRASE }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(body.error ?? t("deleteFailedToast"));
        return;
      }
      // Belt-and-braces client sign-out; the server already did its bit.
      try {
        await createClient().auth.signOut();
      } catch {
        // ignore
      }
      router.replace("/login");
    });
  }

  return (
    <section className="flex flex-col gap-7">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="flex flex-col gap-5 rounded-xl border border-destructive/30 bg-destructive/[0.04] p-6">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
          >
            <AlertTriangle className="size-4" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{t("deleteAccountTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("irreversible")}
            </p>
          </div>
        </div>

        <div className="grid gap-2 text-sm">
          <p className="text-muted-foreground">{t("impactLeader")}</p>
          <ul className="ms-4 list-disc text-muted-foreground">
            <li>{t("impactProfile")}</li>
            <li>{t("impactProducts", { count: counts.products })}</li>
            <li>{t("impactAgents", { count: counts.agents })}</li>
            <li>{t("impactEntries", { count: counts.entries })}</li>
            <li>{t("impactConfirmations", { count: counts.confirmations })}</li>
            <li>{t("impactPendingEmail")}</li>
          </ul>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="danger-confirm">
            {t("typeToConfirmLabel", { phrase: DELETE_CONFIRMATION_PHRASE })}
          </Label>
          <Input
            id="danger-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={DELETE_CONFIRMATION_PHRASE}
            className="h-11"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground">
            {t("emailHint", { email: currentEmail })}
          </p>
        </div>

        <Button
          type="button"
          variant="destructive"
          disabled={!phraseMatches || pending}
          onClick={() => {
            setModalTyped("");
            setModalOpen(true);
          }}
          className="h-10"
        >
          {t("deleteCta")}
        </Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("finalConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("finalConfirmBody")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="danger-confirm-modal">
              {t("typeToConfirmLabel", { phrase: DELETE_CONFIRMATION_PHRASE })}
            </Label>
            <Input
              id="danger-confirm-modal"
              value={modalTyped}
              onChange={(e) => setModalTyped(e.target.value)}
              placeholder={DELETE_CONFIRMATION_PHRASE}
              autoComplete="off"
              spellCheck={false}
              className="h-11"
            />
          </div>

          <div className="-mx-4 -mb-4 mt-2 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={pending}
              className="h-10 px-4"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={deleteAccount}
              disabled={!modalMatches || pending}
              className="h-10 px-4"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("finalConfirmCta")}
                </>
              ) : (
                t("finalConfirmCta")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
