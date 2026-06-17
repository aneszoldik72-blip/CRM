"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  HelpCircle,
  LogOut,
  Moon,
  Settings as SettingsIcon,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { signOut } from "@/app/[locale]/(auth)/actions";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserMenuUser = {
  email: string | null;
  name: string | null;
};

function initialsFrom(user: UserMenuUser, fallback: string) {
  const source = user.name?.trim() || user.email || fallback;
  const parts = source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase());
  return parts.join("") || fallback.charAt(0).toUpperCase();
}

export function UserMenu({ user }: { user: UserMenuUser }) {
  const t = useTranslations("user");
  const { resolvedTheme, setTheme } = useTheme();
  // Defer reading the theme until after mount so the dropdown's theme item
  // doesn't render a server/client-divergent icon. The dropdown content
  // itself is portaled and only paints after open, so this is cheap.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const fallback = t("fallback");
  const displayName =
    user.name?.trim() || user.email?.split("@")[0] || fallback;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("menu")}
            className="size-8 rounded-full p-0"
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback>{initialsFrom(user, fallback)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-2">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {user.email && (
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings/profile" />}>
          <UserIcon /> {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <SettingsIcon /> {t("settings")}
        </DropdownMenuItem>
        {mounted && (
          <DropdownMenuItem
            className="md:hidden"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun /> : <Moon />} {t("theme")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/help" />}>
          <HelpCircle /> {t("help")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOut();
          }}
        >
          <LogOut /> {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
