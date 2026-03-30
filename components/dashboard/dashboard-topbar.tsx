"use client";

import Link from "next/link";
import { Menu, Shield, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/stores/use-auth-store";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/wallet", label: "Wallet" },
  { href: "/dashboard/orders", label: "Orders" },
];

export function DashboardTopbar() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const navItems = user?.is_staff
    ? [
        ...items,
        {
          href: "/dashboard/admin",
          label: "Admin Dashboard",
        },
      ]
    : items;

  return (
    <>
      <div className="rounded-[1.5rem] border border-border bg-card/90 px-4 py-3 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">
              Authenticated area
            </p>
            <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
              Wallet, order history, and delivery management
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg lg:hidden"
            aria-label="Open dashboard navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={`${open ? "pointer-events-auto" : "pointer-events-none"} fixed inset-0 z-50 lg:hidden`}>
        <div
          className={`${open ? "opacity-100" : "opacity-0"} absolute inset-0 bg-slate-950/40 transition-opacity`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`${open ? "translate-x-0" : "-translate-x-full"} absolute left-0 top-0 flex h-full w-[18rem] flex-col border-r border-border bg-card p-4 shadow-2xl transition-transform`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary">Dashboard</p>
              <p className="mt-1 text-lg font-semibold">Navigation</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="mt-6 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-muted hover:bg-bg hover:text-foreground"
              >
                {item.href === "/dashboard/admin" ? <Shield className="h-4 w-4" /> : null}
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
