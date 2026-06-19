import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

const ITEMS = [
  "security",
  "export",
  "arabic",
  "vsLocal",
  "mobile",
  "limits",
  "payments",
  "cancel",
] as const;

// Uses native <details>/<summary> — zero JS, full a11y, perfect for static
// rendering and Lighthouse mobile.
export async function Faq() {
  const t = await getTranslations("marketing.faq");

  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>

        <div className="mt-12 flex flex-col gap-2">
          {ITEMS.map((key) => (
            <details
              key={key}
              className="group rounded-2xl border border-white/5 bg-white/[0.015] transition-colors open:bg-white/[0.03]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-start text-base font-medium text-foreground/95 transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                <span>{t(`items.${key}.q`)}</span>
                <Plus
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`items.${key}.a`)}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
