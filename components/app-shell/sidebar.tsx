"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "@/lib/nav-items";

const STORAGE_KEY = "voidcraft.sidebar.collapsed";

type SidebarProps = {
  variant?: "docked" | "drawer";
};

export function Sidebar({ variant = "docked" }: SidebarProps) {
  const isDrawer = variant === "drawer";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isDrawer) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {
      // localStorage unavailable — ignore.
    }
  }, [isDrawer]);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  const showLabels = isDrawer || !collapsed;

  return (
    <aside
      data-collapsed={collapsed && !isDrawer ? "true" : "false"}
      className={cn(
        "flex flex-col border-e border-border bg-card transition-[width] duration-200",
        isDrawer
          ? "h-full w-full"
          : "sticky top-0 hidden h-dvh md:flex",
        !isDrawer && (collapsed ? "w-16" : "w-60"),
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2 border-b border-border px-4",
          !showLabels && "justify-center px-0",
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          V
        </span>
        {showLabels && (
          <span className="truncate font-semibold tracking-tight">
            VOIDCRAFT
          </span>
        )}
      </div>

      <nav aria-label="Navigation principale" className="flex-1 px-2 py-3">
        <ul className="flex flex-col gap-1">
          {PRIMARY_NAV.map((item) => (
            <SidebarItem key={item.key} item={item} showLabel={showLabels} />
          ))}
        </ul>
        <Separator className="my-3" />
        <ul className="flex flex-col gap-1">
          {SECONDARY_NAV.map((item) => (
            <SidebarItem key={item.key} item={item} showLabel={showLabels} />
          ))}
        </ul>
      </nav>

      {!isDrawer && (
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={
              collapsed
                ? "Étendre la barre latérale"
                : "Réduire la barre latérale"
            }
            className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
            {showLabels && <span>Réduire</span>}
          </button>
        </div>
      )}
    </aside>
  );
}

function SidebarItem({
  item,
  showLabel,
}: {
  item: NavItem;
  showLabel: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-md py-2 text-sm transition-colors",
        showLabel ? "px-3" : "justify-center px-0",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-primary"
        />
      )}
      <Icon className="size-4 shrink-0" />
      {showLabel && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (showLabel) return <li>{link}</li>;

  return (
    <li>
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    </li>
  );
}
