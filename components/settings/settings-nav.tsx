"use client";

import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Settings as Cog,
  ShieldCheck,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  destructive?: boolean;
};

const PRIMARY: NavItem[] = [
  { href: "/settings/profile", labelKey: "profile", icon: UserIcon },
  { href: "/settings/preferences", labelKey: "preferences", icon: Cog },
  { href: "/settings/security", labelKey: "security", icon: ShieldCheck },
];

const DANGER: NavItem[] = [
  {
    href: "/settings/danger",
    labelKey: "danger",
    icon: AlertTriangle,
    destructive: true,
  },
];

export function SettingsNav() {
  const t = useTranslations("settings.nav");
  const pathname = usePathname();

  return (
    <nav className="hidden md:block">
      <ul className="flex flex-col gap-1">
        {PRIMARY.map((item) => (
          <Item key={item.href} item={item} active={isActive(pathname, item.href)} label={t(item.labelKey)} />
        ))}
      </ul>
      <div className="my-3 border-t border-border" />
      <ul className="flex flex-col gap-1">
        {DANGER.map((item) => (
          <Item key={item.href} item={item} active={isActive(pathname, item.href)} label={t(item.labelKey)} />
        ))}
      </ul>
    </nav>
  );
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Item({
  item,
  active,
  label,
}: {
  item: NavItem;
  active: boolean;
  label: string;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
          active
            ? item.destructive
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
            : item.destructive
              ? "text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {active && (
          <span
            aria-hidden
            className={cn(
              "absolute inset-y-1.5 start-0 w-0.5 rounded-full",
              item.destructive ? "bg-destructive" : "bg-primary",
            )}
          />
        )}
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}
