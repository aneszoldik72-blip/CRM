"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const COOLDOWN_SECONDS = 30;

export function ResendVerificationButton({ email }: { email: string }) {
  const t = useTranslations("auth.verify");
  const [pending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleResend() {
    if (!email) {
      toast.error(t("noEmail"));
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t("resent", { email }));
        setCooldown(COOLDOWN_SECONDS);
      }
    });
  }

  const disabled = pending || cooldown > 0 || !email;

  return (
    <Button
      type="button"
      onClick={handleResend}
      disabled={disabled}
      className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> {t("resending")}
        </>
      ) : cooldown > 0 ? (
        <span className="tabular-nums">
          {t("resendCooldown", { seconds: cooldown })}
        </span>
      ) : (
        t("resend")
      )}
    </Button>
  );
}
