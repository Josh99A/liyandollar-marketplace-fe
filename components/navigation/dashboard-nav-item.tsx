"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: string;
};

export function DashboardNavItemLink({
  item,
  active,
  onClick,
  className,
}: {
  item: DashboardNavItem;
  active: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        active
          ? "bg-primary text-white shadow-lg shadow-primary/20"
          : "text-muted hover:bg-bg/70 hover:text-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/80 text-primary transition",
          active ? "border-transparent bg-white/20 text-white" : "group-hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span>{item.label}</span>
    </Link>
  );
}
