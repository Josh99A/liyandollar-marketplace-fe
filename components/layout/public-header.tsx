"use client";

import Link from "next/link";
import { Menu, Moon, Shield, SunMedium, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuthStore } from "@/stores/use-auth-store";
import { cn } from "@/lib/utils/cn";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SupportLauncher } from "@/components/support/support-launcher";

const coreNavItems = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
];

export function PublicHeader() {
  const { setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const authNavItems = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/orders", label: "Orders" },
      ]
    : [
        { href: "/login", label: "Login" },
        { href: "/register", label: "Register" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-4 lg:px-6">
        <BrandLogo
          priority
          className="rounded-[0.9rem] bg-card/95 px-2 py-1 shadow-[0_10px_30px_rgba(7,43,75,0.08)] ring-1 ring-border"
        />

        <nav className="hidden items-center gap-2 md:flex">
          {[...coreNavItems, ...authNavItems].map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isRegister = item.href === "/register";
            if (!user && isRegister) {
              return null;
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-primary text-white shadow-[0_10px_30px_rgba(15,118,110,0.25)]"
                    : "text-muted hover:bg-bg/70 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {!user ? (
            <Link
              href="/register"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,118,110,0.25)]"
            >
              Get started
            </Link>
          ) : null}
          {user?.is_staff ? (
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent/70 px-3 py-2 text-sm font-semibold text-primary"
            >
              <Shield className="h-4 w-4" />
              Admin panel
            </Link>
          ) : null}
          {user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full px-3 py-2 text-sm font-semibold text-muted hover:bg-bg/70 hover:text-foreground"
            >
              Logout
            </button>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <SupportLauncher />
          <button
            type="button"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <SunMedium className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-slate-950/42 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-[19rem] flex-col border-l border-border bg-card/95 px-4 py-4 shadow-2xl backdrop-blur-xl transition-transform",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <BrandLogo className="rounded-[0.9rem] bg-card px-2 py-1 ring-1 ring-border" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="mt-5 flex flex-col gap-2">
            {[...coreNavItems, ...authNavItems].map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const isRegister = item.href === "/register";
              if (!user && isRegister) {
                return null;
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-bg hover:text-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            {!user ? (
              <Link
                href="/register"
                className="rounded-2xl bg-primary px-3 py-2.5 text-sm font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                Get started
              </Link>
            ) : null}
            {user?.is_staff ? (
              <Link
                href="/dashboard/admin"
                className="inline-flex items-center gap-2 rounded-2xl bg-accent/70 px-3 py-2.5 text-sm font-semibold text-primary"
                onClick={() => setOpen(false)}
              >
                <Shield className="h-4 w-4" />
                Admin Portal
              </Link>
            ) : null}
            {user ? (
              <button
                type="button"
                onClick={() => {
                  void logout();
                  setOpen(false);
                }}
                className="rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-muted hover:bg-bg hover:text-foreground"
              >
                Logout
              </button>
            ) : null}
          </nav>
        </aside>
      </div>
    </header>
  );
}
