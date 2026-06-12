"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { signUp } from "../actions";
import { signUpSchema, type SignUpInput } from "@/lib/validators/auth";
import { useResolveAuthError } from "@/lib/auth-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InlineErrorBanner } from "@/components/auth/inline-error-banner";

export default function SignupPage() {
  const t = useTranslations("auth.signup");
  const tLogin = useTranslations("auth.login");
  const resolveAuthError = useResolveAuthError();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", fullName: "", locale: "fr" },
  });

  function onSubmit(values: SignUpInput) {
    setServerError(null);
    const fd = new FormData();
    fd.set("email", values.email);
    fd.set("password", values.password);
    fd.set("fullName", values.fullName ?? "");
    fd.set("locale", values.locale);

    startTransition(async () => {
      const res = await signUp(fd);
      if (res && !res.ok) {
        if (res.fieldErrors) {
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            form.setError(k as keyof SignUpInput, {
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
                    placeholder={t("emailPlaceholder")}
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t("emailHelp")}</FormDescription>
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
                      autoComplete="new-password"
                      className="h-11 pe-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? tLogin("hidePassword")
                          : tLogin("showPassword")
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
                <FormDescription>{t("passwordHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("fullNameLabel")}{" "}
                  <span className="font-normal text-muted-foreground">
                    {t("fullNameOptional")}
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    className="h-11"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>{t("fullNameHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("localeLabel")}</FormLabel>
                <FormControl>
                  <select
                    className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    {...field}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <p className="text-[12px] leading-relaxed text-muted-foreground">
            {t("termsPrefix")}{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              {t("terms")}
            </Link>{" "}
            {t("termsMiddle")}{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              {t("privacy")}
            </Link>
            .
          </p>
        </form>
      </Form>

      <p className="text-center text-[13.5px] text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-foreground hover:underline">
          {t("loginCta")}
        </Link>
      </p>
    </div>
  );
}
