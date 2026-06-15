"use client";

import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ChevronRight,
  Settings as Cog,
  ShieldCheck,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

type Row = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  destructive?: boolean;
};

const PRIMARY: Row[] = [
  { href: "/settings/profile", labelKey: "profile", icon: UserIcon },
  { href: "/settings/preferences", labelKey: "preferences", icon: Cog },
  { href: "/settings/security", labelKey: "security", icon: ShieldCheck },
];

const DANGER: Row[] = [
  {
    href: "/settings/danger",
    labelKey: "danger",
    icon: AlertTriangle,
    destructive: true,
  },
];

export function SettingsListMobile() {
  const t = useTranslations("settings.nav");

  return (
    <div className="flex flex-col gap-6 md:hidden">
      <Group rows={PRIMARY} labelOf={(r) => t(r.labelKey)} />
      <Group rows={DANGER} labelOf={(r) => t(r.labelKey)} />
    </div>
  );
}

function Group({
  rows,
  labelOf,
}: {
  rows: Row[];
  labelOf: (row: Row) => string;
}) {
  return (
    <ul className="overflow-hidden rounded-xl border border-border bg-card">
      {rows.map((row, i) => (
        <li
          key={row.href}
          className={cn(
            i > 0 && "border-t border-border",
          )}
        >
          <Link
            href={row.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50",
              row.destructive && "text-destructive",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                row.destructive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              <row.icon className="size-4" />
            </span>
            <span className="flex-1 text-sm">{labelOf(row)}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
