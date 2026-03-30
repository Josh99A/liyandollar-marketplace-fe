"use client";

import { Plus } from "lucide-react";
import { useModalStore } from "@/stores/use-modal-store";

export function DepositModalTrigger() {
  const open = useModalStore((state) => state.open);

  return (
    <button
      type="button"
      onClick={() =>
        open("deposit", {
          title: "Fund wallet",
          description: "Connect this modal to your payment initialization endpoint.",
        })
      }
      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5"
    >
      <Plus className="h-4 w-4" />
      Deposit funds
    </button>
  );
}
