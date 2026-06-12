import {
  Boxes,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  key: string;
  // Translation key under the `nav.*` namespace.
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV: NavItem[] = [
  {
    key: "dashboard",
    labelKey: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  { key: "products", labelKey: "products", href: "/products", icon: Package },
  { key: "agents", labelKey: "agents", href: "/agents", icon: Users },
  { key: "stock", labelKey: "stock", href: "/stock", icon: Boxes },
];

export const SECONDARY_NAV: NavItem[] = [
  {
    key: "settings",
    labelKey: "settings",
    href: "/settings",
    icon: Settings,
  },
];

export const ALL_NAV: NavItem[] = [...PRIMARY_NAV, ...SECONDARY_NAV];
