"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Check, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  cancelEmailChangeAction,
  changeEmailAction,
  resendEmailChangeAction,
} from "@/app/[locale]/(app)/settings/actions";
import { useResolveValidationError } from "@/lib/validation-messages";
import {
  emailChangeSchema,
  type EmailChangeInput,
} from "@/lib/validators/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InlineErrorBanner } from "@/components/auth/inline-error-banner";

export type EmailChangeFormProps = {
  currentEmail: string;
  pendingEmail: string | null;
};

export function EmailChangeForm({
  currentEmail,
  pendingEmail,
}: EmailChangeFormProps) {
  const t = useTranslations("settings.security.email");
  const resolveError = useResolveValidationError();
  const [editing, setEditing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<EmailChangeInput>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: EmailChangeInput) {
    setServerError(null);
    startTransition(async () => {
      const res = await changeEmailAction(values);
      if (res.ok) {
        toast.success(t("submittedToast"));
        setEditing(false);
        form.reset({ email: "" });
        return;
      }
      if (res.fieldErrors?.email) {
        form.setError("email", {
          message: resolveError(res.fieldErrors.email),
        });
      }
      if (res.serverError) setServerError(res.serverError);
    });
  }

  function resend() {
    startTransition(async () => {
      const res = await resendEmailChangeAction();
      if (res.ok) toast.success(t("resentToast"));
      else toast.error(res.serverError ?? t("resendFailedToast"));
    });
  }

  function cancelPending() {
    startTransition(async () => {
      const res = await cancelEmailChangeAction();
      if (res.ok) toast.success(t("cancelledToast"));
      else toast.error(res.serverError ?? t("cancelFailedToast"));
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <p className="text-sm font-medium">{t("title")}</p>
          <p className="text-xs text-muted-foreground">{t("sub")}</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{currentEmail}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
            <Check className="size-3" />
            {t("verified")}
          </span>
        </div>
        {!pendingEmail && !editing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
          >
            {t("change")}
          </Button>
        )}
      </div>

      {pendingEmail && (
        <div className="grid gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 text-amber-500" aria-hidden />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {t("pending.title", { email: pendingEmail })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("pending.body", { current: currentEmail })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resend}
              disabled={pending}
            >
              {t("pending.resend")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelPending}
              disabled={pending}
            >
              {t("pending.cancelChange")}
            </Button>
          </div>
        </div>
      )}

      {editing && !pendingEmail && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-3 border-t border-border pt-3"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("newEmailLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="new@example.com"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {serverError && <InlineErrorBanner message={serverError} />}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setServerError(null);
                  form.reset({ email: "" });
                }}
                disabled={pending}
              >
                {t("cancelEdit")}
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  t("submit")
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </section>
  );
}
