"use client";

import Link from "next/link";
import { Bell, Menu, Moon, Search, SunMedium, UserCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTheme } from "@/components/providers/theme-provider";
import { BrandLogo } from "@/components/layout/brand-logo";
import { DashboardMobileDrawer } from "@/components/navigation/dashboard-mobile-drawer";
import { adminNav, primaryNav, supportNav, walletNav } from "@/components/navigation/dashboard-nav-data";
import { cn } from "@/lib/utils/cn";
import { getNotifications, markNotificationsRead } from "@/lib/services/notifications";
import type { NotificationItem } from "@/types";
import { SupportLauncher } from "@/components/support/support-launcher";

export function DashboardTopbar() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const items = await getNotifications();
      setNotifications(items);
      const unreadIds = items.filter((item) => !item.is_read).map((item) => item.id);
      await markNotificationsRead(unreadIds);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const sections = useMemo(
    () => [
      { title: "Overview", items: primaryNav },
      { title: "Wallet", items: walletNav },
      { title: "Account", items: supportNav },
      ...(user?.is_staff ? [{ title: "Admin", items: adminNav }] : []),
    ],
    [user?.is_staff],
  );

  const initials =
    user?.first_name || user?.last_name
      ? `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase()
      : user?.username?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";
  const displayName = user?.username || user?.email || "Account";

  return (
    <>
      <header className="sticky top-4 z-30 flex items-center justify-between gap-4 rounded-[1.5rem] border border-border bg-card/90 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg lg:hidden"
            aria-label="Open dashboard navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="hidden lg:block">
            <BrandLogo className="rounded-[0.85rem] bg-card px-2 py-1 ring-1 ring-border" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Dashboard</p>
            <h1 className="mt-1 text-lg font-semibold sm:text-xl">
              Welcome back{user?.first_name ? `, ${user.first_name}` : ""}.
            </h1>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Search orders, wallets, or products..."
              className="w-full rounded-full border border-border bg-bg/70 py-2 pl-11 pr-4 text-sm outline-none placeholder:text-muted/70 focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SupportLauncher className="bg-bg" />
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const next = !notificationsOpen;
                setNotificationsOpen(next);
                if (next) {
                  void loadNotifications();
                }
              }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500" />
              ) : null}
            </button>
            <div
              className={cn(
                "absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card/95 p-3 shadow-[var(--shadow-soft)] backdrop-blur-lg",
                notificationsOpen ? "block" : "hidden",
              )}
            >
              <div className="flex items-center justify-between px-2">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">Notifications</p>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-primary"
                >
                  Close
                </button>
              </div>
              {notificationsLoading ? (
                <div className="mt-3 rounded-xl border border-border bg-bg/70 px-3 py-3 text-sm text-muted">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="mt-3 rounded-xl border border-border bg-bg/70 px-3 py-3 text-sm text-muted">
                  You are all caught up.
                </div>
              ) : (
                <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
                  {notifications.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border bg-bg/70 px-3 py-3 text-sm"
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-muted">{item.message}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-muted">
                        {item.created_at}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg text-foreground"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <SunMedium className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1.5 text-sm font-semibold"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {initials}
              </span>
              <span className="hidden sm:inline">{displayName}</span>
              <UserCircle2 className="h-4 w-4 text-muted" />
            </button>

            <div
              className={cn(
                "absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card/95 p-2 shadow-[var(--shadow-soft)] backdrop-blur-lg",
                menuOpen ? "block" : "hidden",
              )}
            >
              <div className="px-3 py-2">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">Signed in</p>
                <p className="mt-1 text-sm font-semibold">{displayName}</p>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <Link
                  href="/dashboard/settings/account"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-bg"
                  onClick={() => setMenuOpen(false)}
                >
                  Account settings
                </Link>
                <Link
                  href="/dashboard/settings/security"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-bg"
                  onClick={() => setMenuOpen(false)}
                >
                  Security
                </Link>
              </div>
              <button
                type="button"
                onClick={() => {
                  void logout();
                  setMenuOpen(false);
                }}
                className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-500/10"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <DashboardMobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        sections={sections}
        pathname={pathname}
      />
    </>
  );
}
