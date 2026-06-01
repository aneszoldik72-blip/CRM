"use client";

import { useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { getCountry, type CurrencyCode } from "@/lib/data/countries";
import {
  productInputSchema,
  type ProductInput,
} from "@/lib/validators/product";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CountryCombobox } from "@/components/products/country-combobox";
import { CurrencySelect } from "@/components/products/currency-select";
import { InlineErrorBanner } from "@/components/auth/inline-error-banner";

export type ProductFormValues = ProductInput;

export type ProductFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<ProductFormValues>;
  submitLabel: string;
  cancelLabel?: string;
  onCancel?: () => void;
  onSubmit: (
    values: ProductFormValues,
  ) => Promise<{ ok: boolean; serverError?: string; fieldErrors?: Record<string, string> }>;
};

export function ProductForm({
  mode,
  defaultValues,
  submitLabel,
  cancelLabel = "Annuler",
  onCancel,
  onSubmit,
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productInputSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      country: defaultValues?.country ?? "",
      currency: (defaultValues?.currency as CurrencyCode | undefined) ?? "USD",
    },
  });

  // In edit mode, the existing currency is "intentional" — don't auto-override
  // when the user changes country. In create mode, currency tracks country
  // until the user manually picks one.
  const userTouchedCurrency = useRef(mode === "edit");
  const [pending, startTransition] = useTransition();
  const serverError = form.formState.errors.root?.serverError?.message;

  function submit(values: ProductFormValues) {
    startTransition(async () => {
      const res = await onSubmit(values);
      if (!res.ok) {
        if (res.fieldErrors) {
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            form.setError(k as keyof ProductFormValues, { message: v });
          }
        }
        if (res.serverError) {
          form.setError("root.serverError", { message: res.serverError });
        }
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="grid gap-5"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du produit *</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder="Ex. Slim Fit T-Shirt"
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
          name="country"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Pays *</FormLabel>
              <FormControl>
                <CountryCombobox
                  value={field.value || null}
                  invalid={!!fieldState.error}
                  onChange={(code) => {
                    field.onChange(code);
                    if (!userTouchedCurrency.current) {
                      const country = getCountry(code);
                      if (country)
                        form.setValue("currency", country.defaultCurrency, {
                          shouldValidate: true,
                        });
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currency"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Devise *</FormLabel>
              <FormControl>
                <CurrencySelect
                  value={(field.value as CurrencyCode) || null}
                  invalid={!!fieldState.error}
                  onChange={(code) => {
                    userTouchedCurrency.current = true;
                    field.onChange(code);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && <InlineErrorBanner message={serverError} />}

        <div className="-mx-4 -mb-4 mt-2 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={pending}
              className="h-10 px-4"
            >
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={pending} className="h-10 px-4">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {mode === "create" ? "Ajout en cours…" : "Mise à jour…"}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
