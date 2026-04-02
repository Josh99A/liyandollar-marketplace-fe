"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Menu,
  Moon,
  Shield,
  SunMedium,
  UserCircle2,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuthStore } from "@/stores/use-auth-store";
import { cn } from "@/lib/utils/cn";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SupportLauncher } from "@/components/support/support-launcher";
import { getNotifications, markNotificationsRead } from "@/lib/services/notifications";
import type { NotificationItem } from "@/types";

const navItems = [
  { href: "/", label: "Home" },
];

const categoryItems = [
  { href: "/?tag=facebook", label: "Facebook Accounts" },
  { href: "/?tag=instagram", label: "Instagram Accounts" },
  { href: "/?tag=email", label: "Emails" },
  { href: "/?tag=gift", label: "Gift Cards" },
];

type NavLinkProps = {
  href: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

function NavLink({ href, label, active, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-2 text-sm font-semibold transition",
        active
          ? "bg-primary text-white shadow-[0_10px_24px_rgba(15,118,110,0.22)]"
          : "text-muted hover:bg-bg hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-bg"
    >
      {children}
    </button>
  );
}

export function PublicHeader() {
  const { setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const displayName = user?.username || user?.email || "Account";
  const initials =
    user?.first_name || user?.last_name
      ? `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase()
      : user?.username?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const items = await getNotifications();
      setNotifications(items);
      const unreadIds = items.filter((item) => !item.is_read).map((item) => item.id);
      if (unreadIds.length > 0) {
        await markNotificationsRead(unreadIds);
      }
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [drawerOpen]);

  const drawer = (
    <div
      className={cn(
        "fixed inset-0 z-[70] lg:hidden",
        drawerOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!drawerOpen}
    >
      <div
        className={cn(
          "absolute inset-0 bg-slate-950/70 transition-opacity",
          drawerOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-[20rem] flex-col border-l border-border bg-[var(--color-card)] px-4 py-4 shadow-2xl transition-transform",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <BrandLogo className="rounded-[0.9rem] bg-card px-2 py-1 ring-1 ring-border" />
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={active}
                onClick={() => setDrawerOpen(false)}
              />
            );
          })}

          <div className="rounded-2xl border border-border bg-bg/60 p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Categories</p>
            <div className="mt-2 grid gap-1">
              {categoryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-bg"
                  onClick={() => setDrawerOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto grid gap-2">
          {!user ? (
            <>
              <Link
                href="/login"
                className="rounded-2xl border border-border px-3 py-2.5 text-center text-sm font-semibold text-foreground"
                onClick={() => setDrawerOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-2xl bg-primary px-3 py-2.5 text-center text-sm font-semibold text-white"
                onClick={() => setDrawerOpen(false)}
              >
                Get started
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-bg/70 px-3 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {initials}
                </span>
                <div>
                  <p className="text-sm font-semibold">{displayName}</p>
                  <p className="text-xs text-muted">Signed in</p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="rounded-2xl border border-border px-3 py-2.5 text-center text-sm font-semibold text-foreground"
                onClick={() => setDrawerOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/orders"
                className="rounded-2xl border border-border px-3 py-2.5 text-center text-sm font-semibold text-foreground"
                onClick={() => setDrawerOpen(false)}
              >
                Orders
              </Link>
              <Link
                href="/dashboard/wallet"
                className="rounded-2xl border border-border px-3 py-2.5 text-center text-sm font-semibold text-foreground"
                onClick={() => setDrawerOpen(false)}
              >
                Wallet
              </Link>
              {user?.is_staff ? (
                <Link
                  href="/dashboard/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent/70 px-3 py-2.5 text-sm font-semibold text-primary"
                  onClick={() => setDrawerOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  void logout();
                  setDrawerOpen(false);
                }}
                className="rounded-2xl border border-border px-3 py-2.5 text-sm font-semibold text-rose-600"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-[60] border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <BrandLogo
            priority
            ariaLabel="Go to homepage"
            className="h-12 px-1 py-1"
            imageClassName="w-[3.4rem] sm:w-[3.9rem]"
          />
        </div>

        <nav className="hidden items-center gap-1.5 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <NavLink key={item.href} href={item.href} label={item.label} active={active} />
            );
          })}

          <div className="relative">
            <button
              type="button"
              onClick={() => setCategoryOpen((value) => !value)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition",
                categoryOpen
                  ? "bg-primary text-white shadow-[0_10px_24px_rgba(15,118,110,0.22)]"
                  : "text-muted hover:bg-bg hover:text-foreground",
              )}
              aria-haspopup="menu"
              aria-expanded={categoryOpen}
            >
              Categories
              <ChevronDown className="h-4 w-4" />
            </button>
            <div
              className={cn(
                "absolute left-0 mt-2 w-56 rounded-2xl border border-border bg-card/95 p-2 shadow-[var(--shadow-soft)] backdrop-blur-lg",
                categoryOpen ? "block" : "hidden",
              )}
            >
              {categoryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-bg"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-2">
          {!user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-bg"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,118,110,0.24)]"
              >
                Get started
              </Link>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <SupportLauncher className="bg-card" />
              <div className="relative">
                <IconButton
                  label="Notifications"
                  onClick={() => {
                    const next = !notificationsOpen;
                    setNotificationsOpen(next);
                    if (next) {
                      void loadNotifications();
                    }
                  }}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 ? (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
                  ) : null}
                </IconButton>
                <div
                  className={cn(
                    "absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-card/95 p-3 shadow-[var(--shadow-soft)] backdrop-blur-lg",
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
                      No new notifications.
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

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 text-sm font-semibold"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {initials}
                  </span>
                  <span className="hidden md:inline">{displayName}</span>
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
                      href="/dashboard"
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-bg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/orders"
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-bg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      href="/dashboard/wallet"
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-bg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Wallet
                    </Link>
                    <Link
                      href="/dashboard/settings/account"
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-bg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Settings
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
          )}

          <button
            type="button"
            onClick={() => {
              if (!mounted) return;
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
            }}
            disabled={!mounted}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground"
            aria-label="Toggle theme"
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <SunMedium className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <span className="h-4 w-4" aria-hidden />
            )}
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card lg:hidden"
            onClick={() => setDrawerOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      </header>
      {mounted && drawerOpen && typeof document !== "undefined" ? createPortal(drawer, document.body) : null}
    </>
  );
}
