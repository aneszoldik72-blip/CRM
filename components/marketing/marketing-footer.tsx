import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/auth/language-switcher";

export async function MarketingFooter() {
  const t = await getTranslations("marketing.footer");
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t("columns.product.title"),
      links: [
        { href: "#features", label: t("columns.product.features") },
        { href: "#pricing", label: t("columns.product.pricing") },
        { href: "#", label: t("columns.product.changelog") },
      ],
    },
    {
      title: t("columns.company.title"),
      links: [
        { href: "#", label: t("columns.company.about") },
        { href: "mailto:hello@voidcraft.app", label: t("columns.company.contact") },
        { href: "#", label: t("columns.company.blog") },
      ],
    },
    {
      title: t("columns.legal.title"),
      links: [
        { href: "/privacy", label: t("columns.legal.privacy") },
        { href: "/terms", label: t("columns.legal.terms") },
        { href: "#", label: t("columns.legal.cookies") },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/5 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <span>VOIDCRAFT</span>
            </Link>
            <p className="mt-3 max-w-[20ch] text-sm text-muted-foreground">
              {t("tagline")}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">{t("copyright", { year })}</p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
