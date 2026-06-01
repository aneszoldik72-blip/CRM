// Stateless for now. Will be wired to next-intl in a later session.
const locales = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "ar", label: "ع" },
] as const;

export function LanguageSwitcher({ active = "fr" as const }: { active?: "fr" | "en" | "ar" }) {
  return (
    <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
      {locales.map((l, i) => (
        <span key={l.code} className="flex items-center gap-3">
          {i > 0 && <span className="opacity-40">·</span>}
          <button
            type="button"
            aria-current={active === l.code ? "true" : undefined}
            className={
              "transition-colors hover:text-foreground " +
              (active === l.code ? "text-foreground" : "")
            }
          >
            {l.label}
          </button>
        </span>
      ))}
    </div>
  );
}
