"use client";

import { X } from "lucide-react";
import { useModalStore } from "@/stores/use-modal-store";

export function ModalRenderer() {
  const { type, payload, close } = useModalStore();

  if (!type) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">
              Modal system
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{payload?.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              {payload?.description}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {type === "deposit" ? (
          <form className="mt-6 grid gap-4">
            <label className="space-y-2 text-sm font-medium">
              <span>Deposit amount</span>
              <input
                type="number"
                min="10"
                className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                placeholder="100"
              />
            </label>
            <button
              type="button"
              onClick={close}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Continue
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
