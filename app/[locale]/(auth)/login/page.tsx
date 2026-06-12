"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { signIn } from "../actions";
import { signInSchema, type SignInInput } from "@/lib/validators/auth";
import { useResolveAuthError } from "@/lib/auth-messages";
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

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const resolveAuthError = useResolveAuthError();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  // Read previously-saved preference so the toggle reflects past choice.
  useEffect(() => {
    try {
      const v = localStorage.getItem("voidcraft.remember_me");
      if (v === "1") form.setValue("rememberMe", true);
    } catch {}
  }, [form]);

  function onSubmit(values: SignInInput) {
    setServerError(null);
    try {
      localStorage.setItem(
        "voidcraft.remember_me",
        values.rememberMe ? "1" : "0",
      );
    } catch {}

    const fd = new FormData();
    fd.set("email", values.email);
    fd.set("password", values.password);
    if (values.rememberMe) fd.set("rememberMe", "on");

    startTransition(async () => {
      const res = await signIn(fd);
      if (res && !res.ok) {
        if (res.fieldErrors) {
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            form.setError(k as keyof SignInInput, {
              message: resolveAuthError(v),
            });
          }
        }
        if (res.serverError) setServerError(resolveAuthError(res.serverError));
      }
    });
  }

  return (
    <div className="grid gap-7">
      <header className="grid gap-2">
        <h1 className="text-[28px] font-medium leading-tight tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-[15px] text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("emailLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("passwordLabel")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="h-11 pe-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-muted-foreground select-none">
              <input
                type="checkbox"
                className="size-4 cursor-pointer rounded border-input bg-transparent accent-[#8b6bff]"
                checked={!!form.watch("rememberMe")}
                onChange={(e) => form.setValue("rememberMe", e.target.checked)}
              />
              {t("rememberMe")}
            </label>
            <Link
              href="/forgot-password"
              className="text-[13.5px] text-muted-foreground hover:text-foreground"
            >
              {t("forgotPassword")}
            </Link>
          </div>

          {serverError && <InlineErrorBanner message={serverError} />}

          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center text-[13.5px] text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/signup" className="text-foreground hover:underline">
          {t("signupCta")}
        </Link>
      </p>
    </div>
  );
}
