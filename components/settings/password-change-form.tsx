"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  changePasswordAction,
  signOutOtherSessionsAction,
} from "@/app/[locale]/(app)/settings/actions";
import { useResolveValidationError } from "@/lib/validation-messages";
import {
  passwordChangeSchema,
  type PasswordChangeInput,
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
import { PasswordStrength } from "@/components/auth/password-strength";

export function PasswordChangeForm() {
  const t = useTranslations("settings.security.password");
  const resolveError = useResolveValidationError();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = form.watch("newPassword");

  function onSubmit(values: PasswordChangeInput) {
    setServerError(null);
    startTransition(async () => {
      const res = await changePasswordAction(values);
      if (res.ok) {
        toast.success(t("updatedToast"));
        form.reset({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setUpdatedAt(Date.now());
        return;
      }
      if (res.fieldErrors) {
        for (const [k, v] of Object.entries(res.fieldErrors)) {
          form.setError(k as keyof PasswordChangeInput, {
            message: resolveError(v),
          });
        }
      }
      if (res.serverError) setServerError(res.serverError);
    });
  }

  function signOutOthers() {
    startTransition(async () => {
      const res = await signOutOtherSessionsAction();
      if (res.ok) {
        toast.success(t("signedOutOthersToast"));
        setUpdatedAt(null);
      } else {
        toast.error(res.serverError ?? t("signOutOthersFailedToast"));
      }
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <header className="flex flex-col">
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="text-xs text-muted-foreground">{t("sub")}</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("current")}</FormLabel>
                <FormControl>
                  <PwInput
                    {...field}
                    show={showAll}
                    onToggle={() => setShowAll((v) => !v)}
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("new")}</FormLabel>
                <FormControl>
                  <PwInput
                    {...field}
                    show={showAll}
                    onToggle={() => setShowAll((v) => !v)}
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <PasswordStrength value={newPasswordValue ?? ""} />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("confirm")}</FormLabel>
                <FormControl>
                  <PwInput
                    {...field}
                    show={showAll}
                    onToggle={() => setShowAll((v) => !v)}
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverError && <InlineErrorBanner message={serverError} />}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </div>
        </form>
      </Form>

      {updatedAt && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background/40 p-4">
          <div className="flex flex-col">
            <p className="text-sm font-medium">{t("signOutOthersTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("signOutOthersBody")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={signOutOthers}
            disabled={pending}
          >
            {t("signOutOthersCta")}
          </Button>
        </div>
      )}
    </section>
  );
}

type PwInputProps = React.ComponentProps<typeof Input> & {
  show: boolean;
  onToggle: () => void;
};

function PwInput({ show, onToggle, ...rest }: PwInputProps) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        className="h-11 pe-10"
        {...rest}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
