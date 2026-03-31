"use client";

import { X } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { DashboardNavItemLink } from "@/components/navigation/dashboard-nav-item";
import type { DashboardNavItem } from "@/components/navigation/dashboard-nav-item";
import { cn } from "@/lib/utils/cn";

export function DashboardMobileDrawer({
  open,
  onClose,
  sections,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  sections: { title: string; items: DashboardNavItem[] }[];
  pathname: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-slate-950/45 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute left-0 top-0 flex h-full w-[18rem] flex-col border-r border-border bg-card/95 px-4 py-4 shadow-2xl backdrop-blur-xl transition-transform",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <BrandLogo className="rounded-[0.85rem] bg-card px-2 py-1 ring-1 ring-border" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
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
                    <DashboardNavItemLink
                      key={item.href}
                      item={item}
                      active={active}
                      onClick={onClose}
                      className="px-3"
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
