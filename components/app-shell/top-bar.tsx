"use client";

import { useState } from "react";
import { Menu as MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/app-shell/sidebar";
import { LanguageSwitcher } from "@/components/app-shell/language-switcher";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { UserMenu, type UserMenuUser } from "@/components/app-shell/user-menu";

export function TopBar({ user }: { user: UserMenuUser }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-6">
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Ouvrir le menu"
              className="md:hidden"
            />
          }
        >
          <MenuIcon className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Liens principaux de l&apos;application
          </SheetDescription>
          <Sidebar variant="drawer" />
        </SheetContent>
      </Sheet>

      <span className="font-semibold tracking-tight md:hidden">VOIDCRAFT</span>

      <div className="ms-auto flex items-center gap-1">
        <LanguageSwitcher />
        <span className="hidden md:inline-flex">
          <ThemeToggle />
        </span>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
