import { ArrowDownLeft, ArrowUpRight, Wallet2 } from "lucide-react";
import type { WalletSummary } from "@/types";

export function WalletCard({ wallet }: { wallet: WalletSummary }) {
  return (
    <section className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex rounded-2xl bg-accent p-3 text-primary">
            <Wallet2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.24em] text-muted">
            Available balance
          </p>
          <h2 className="mt-2 font-display text-4xl font-bold">
            ${wallet.balance.toFixed(2)}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-border bg-bg/65 p-4">
            <div className="mb-3 inline-flex rounded-xl bg-emerald-500/12 p-2 text-success">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted">Total deposits</p>
            <p className="mt-2 text-xl font-semibold">
              ${wallet.totalDeposits.toFixed(2)}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-bg/65 p-4">
            <div className="mb-3 inline-flex rounded-xl bg-amber-500/12 p-2 text-warning">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted">Total spend</p>
            <p className="mt-2 text-xl font-semibold">
              ${wallet.totalSpend.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
