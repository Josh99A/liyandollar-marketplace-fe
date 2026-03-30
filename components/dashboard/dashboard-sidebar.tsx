"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Shield, Wallet } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useAuthStore } from "@/stores/use-auth-store";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/orders", label: "Orders", icon: Receipt },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const navItems = user?.is_staff
    ? [
        ...items,
        {
          href: "/dashboard/admin",
          label: "Admin Dashboard",
          icon: Shield,
        },
      ]
    : items;

  return (
    <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)] lg:block">
      <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#072b4b,#0b5fd8_55%,#4ccb70)] p-5 text-white">
        <BrandLogo className="w-fit rounded-2xl bg-white/96 px-3 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.16)]" />
        <p className="mt-4 text-sm uppercase tracking-[0.24em] text-white/70">Dashboard</p>
        <h2 className="mt-2 font-display text-2xl font-bold">Customer workspace</h2>
        <p className="mt-3 text-sm leading-7 text-white/80">
          Protected area for balances, orders, and secure downloads.
        </p>
      </div>

      <nav className="mt-6 flex flex-col gap-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          const className = cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold",
            active
              ? "bg-primary text-white shadow-lg"
              : "text-muted hover:bg-bg/70 hover:text-foreground",
          );

          return (
            <Link key={href} href={href} className={className}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
