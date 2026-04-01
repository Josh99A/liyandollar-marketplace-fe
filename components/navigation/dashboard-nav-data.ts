import {
  ArrowDownLeft,
  ArrowUpRight,
  LifeBuoy,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Settings,
  Shield,
  Home,
  Store,
  Wallet,
} from "lucide-react";
import type { DashboardNavItem } from "@/components/navigation/dashboard-nav-item";

export const primaryNav: DashboardNavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, matchPrefix: "/dashboard" },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/dashboard/orders", label: "Orders", icon: Receipt, matchPrefix: "/dashboard/orders" },
];

export const walletNav: DashboardNavItem[] = [
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet, matchPrefix: "/dashboard/wallet" },
  { href: "/dashboard/wallet/deposit", label: "Deposits", icon: ArrowDownLeft },
  { href: "/dashboard/wallet/withdraw", label: "Withdrawals", icon: ArrowUpRight },
  { href: "/dashboard/wallet/logs", label: "Transactions", icon: ScrollText },
];

export const supportNav: DashboardNavItem[] = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

export const adminNav: DashboardNavItem[] = [
  { href: "/dashboard/admin", label: "Admin Dashboard", icon: Shield, matchPrefix: "/dashboard/admin" },
];
