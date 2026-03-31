import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useAuthStore } from "@/stores/use-auth-store";
import { DashboardNavItemLink } from "@/components/navigation/dashboard-nav-item";
import { adminNav, primaryNav, supportNav, walletNav } from "@/components/navigation/dashboard-nav-data";
import { LogOut } from "lucide-react";

export function DashboardSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const sections = [
    { title: "Overview", items: primaryNav },
    { title: "Wallet", items: walletNav },
    { title: "Account", items: supportNav },
    ...(user?.is_staff ? [{ title: "Admin", items: adminNav }] : []),
  ];

  return (
    <aside className="hidden w-72 shrink-0 flex-col rounded-[2rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)] lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:flex">
      <div className="rounded-[1.5rem] border border-border bg-bg/70 p-5">
        <BrandLogo className="w-fit rounded-2xl bg-card px-3 py-2 shadow-[0_12px_32px_rgba(7,43,75,0.12)]" />
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted">Dashboard</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Wallet workspace</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Manage balances, orders, deposits, and withdrawals from one secure hub.
        </p>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-6 overflow-auto pr-1">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              {section.title}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {section.items.map((item) => {
                const active = item.matchPrefix
                  ? pathname.startsWith(item.matchPrefix)
                  : pathname === item.href;
                return (
                  <DashboardNavItemLink key={item.href} item={item} active={active} />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-500/10"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200/60 bg-rose-500/10">
            <LogOut className="h-4 w-4" />
          </span>
          Logout
        </button>
      </div>
    </aside>
  );
}
