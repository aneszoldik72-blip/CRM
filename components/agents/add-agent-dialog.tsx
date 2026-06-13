"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ChevronDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { agentInputSchema, type AgentInput } from "@/lib/validators/agent";
import { useResolveValidationError } from "@/lib/validation-messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InlineErrorBanner } from "@/components/auth/inline-error-banner";

export type AddAgentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<AgentInput>;
  mode?: "create" | "edit";
  onSubmit: (values: AgentInput) => Promise<{
    ok: boolean;
    serverError?: string;
    fieldErrors?: Record<string, string>;
  }>;
};

export function AddAgentDialog({
  open,
  onOpenChange,
  defaultValues,
  mode = "create",
  onSubmit,
}: AddAgentDialogProps) {
  const t = useTranslations("agents");
  const tCommon = useTranslations("common");
  const resolveError = useResolveValidationError();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(
    Boolean(defaultValues?.phone || defaultValues?.photo_url),
  );

  const form = useForm<AgentInput>({
    resolver: zodResolver(agentInputSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      phone: defaultValues?.phone ?? null,
      photo_url: defaultValues?.photo_url ?? null,
    },
  });

  function submit(values: AgentInput) {
    setServerError(null);
    startTransition(async () => {
      const res = await onSubmit(values);
      if (res.ok) {
        onOpenChange(false);
        form.reset({ name: "", phone: null, photo_url: null });
        return;
      }
      if (res.fieldErrors) {
        for (const [k, v] of Object.entries(res.fieldErrors)) {
          form.setError(k as keyof AgentInput, { message: resolveError(v) });
        }
      }
      if (res.serverError) setServerError(resolveError(res.serverError));
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? t("editAgent") : t("newAgent")}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" ? t("editAgentDesc") : t("newAgentDesc")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-5" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      autoFocus
                      placeholder={t("namePlaceholder")}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  showMore && "rotate-180",
                )}
              />
              {t("moreDetails")}
            </button>

            {showMore && (
              <div className="grid gap-5">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("phoneLabel")}{" "}
                        <span className="font-normal text-muted-foreground">
                          {t("phoneOptional")}
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="tel"
                          className="h-11"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("photoLabel")}{" "}
                        <span className="font-normal text-muted-foreground">
                          {t("photoOptional")}
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          autoComplete="off"
                          placeholder="https://…"
                          className="h-11"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {serverError && <InlineErrorBanner message={serverError} />}

            <div className="-mx-4 -mb-4 mt-2 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
                className="h-10 px-4"
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={pending} className="h-10 px-4">
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {mode === "edit"
                      ? t("submittingUpdate")
                      : t("submittingCreate")}
                  </>
                ) : mode === "edit" ? (
                  t("submitEdit")
                ) : (
                  t("submitAdd")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
