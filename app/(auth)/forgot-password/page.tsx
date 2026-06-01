"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";

import { requestPasswordReset } from "../actions";
import {
  requestResetSchema,
  type RequestResetInput,
} from "@/lib/validators/auth";
import { resolveAuthError } from "@/lib/auth-messages";
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

const COOLDOWN_SECONDS = 30;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<RequestResetInput>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function submit(email: string) {
    setServerError(null);
    const fd = new FormData();
    fd.set("email", email);
    startTransition(async () => {
      const res = await requestPasswordReset(fd);
      if (res.ok) {
        setSentTo(email);
        setCooldown(COOLDOWN_SECONDS);
      } else {
        if (res.fieldErrors?.email) {
          form.setError("email", {
            message: resolveAuthError(res.fieldErrors.email),
          });
        }
        if (res.serverError) setServerError(resolveAuthError(res.serverError));
      }
    });
  }

  if (sentTo) {
    return (
      <div className="grid gap-7">
        <div className="grid gap-4">
          <div className="relative inline-flex size-12 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, #8b6bff 0%, transparent 70%)",
              }}
            />
            <Mail className="relative size-7 text-foreground" />
          </div>
          <h1 className="text-[28px] font-medium leading-tight tracking-tight text-foreground">
            Email envoyé.
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Nous avons envoyé un lien de réinitialisation à{" "}
            <strong className="text-foreground">{sentTo}</strong>. Cliquez
            dessus pour choisir un nouveau mot de passe.
          </p>
        </div>

        <div className="grid gap-3">
          <Button
            type="button"
            onClick={() => submit(sentTo)}
            disabled={pending || cooldown > 0}
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Envoi…
              </>
            ) : cooldown > 0 ? (
              <span className="tabular-nums">Renvoyer dans {cooldown}s</span>
            ) : (
              "Renvoyer le lien"
            )}
          </Button>
          <Link
            href="/login"
            className="text-center text-[13.5px] text-muted-foreground hover:text-foreground"
          >
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-7">
      <header className="grid gap-2">
        <h1 className="text-[28px] font-medium leading-tight tracking-tight text-foreground">
          Mot de passe oublié ?
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Pas de souci. Donnez-nous votre email, on vous envoie un lien.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => submit(v.email))}
          className="grid gap-5"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
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

          {serverError && <InlineErrorBanner message={serverError} />}

          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Envoi…
              </>
            ) : (
              "Envoyer le lien"
            )}
          </Button>

          <Link
            href="/login"
            className="text-center text-[13.5px] text-muted-foreground hover:text-foreground"
          >
            ← Retour
          </Link>
        </form>
      </Form>
    </div>
  );
}
