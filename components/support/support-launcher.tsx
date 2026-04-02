"use client";

import { LifeBuoy } from "lucide-react";
import { useSupportStore } from "@/stores/use-support-store";
import { cn } from "@/lib/utils/cn";

export function SupportLauncher({ className }: { className?: string }) {
  const open = useSupportStore((state) => state.open);

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:-translate-y-0.5",
        className,
      )}
      aria-label="Open support"
      title="Support"
    >
      <LifeBuoy className="h-4 w-4" />
    </button>
  );
}
