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
  label: string;
  href: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV: NavItem[] = [
  {
    key: "dashboard",
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  { key: "products", label: "Produits", href: "/products", icon: Package },
  { key: "agents", label: "Agents", href: "/agents", icon: Users },
  { key: "stock", label: "Stock", href: "/stock", icon: Boxes },
];

export const SECONDARY_NAV: NavItem[] = [
  { key: "settings", label: "Paramètres", href: "/settings", icon: Settings },
];

export const ALL_NAV: NavItem[] = [...PRIMARY_NAV, ...SECONDARY_NAV];
