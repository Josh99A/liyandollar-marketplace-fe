import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import type { WalletTransactionLog } from "@/types";

function statusStyles(status: string) {
  switch (status) {
    case "confirmed":
    case "approved":
    case "completed":
      return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300";
    case "rejected":
    case "failed":
      return "bg-rose-500/12 text-rose-700 dark:text-rose-300";
    default:
      return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
  }
}

export function WalletTransactionList({
  transactions,
}: {
  transactions: WalletTransactionLog[];
}) {
  return (
    <section className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-primary">
            Transactions
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Latest movements</h2>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-border bg-bg/60 p-6 text-sm text-muted">
          No wallet transactions yet.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {transactions.map((transaction) => {
            const isDeposit = transaction.transaction_type === "deposit";
            return (
              <div
                key={transaction.id}
                className="flex flex-col gap-4 rounded-3xl border border-border bg-bg/65 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-card p-3 text-primary">
                    {isDeposit ? (
                      <ArrowDownCircle className="h-5 w-5" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {transaction.transaction_type === "deposit" ? "Deposit" : "Withdrawal"}
                    </p>
                    <p className="text-sm text-muted">
                      {transaction.created_at} • {transaction.description || transaction.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusStyles(transaction.status)}`}
                  >
                    {transaction.status}
                  </span>
                  <p className="text-lg font-semibold">
                    {isDeposit ? "+" : "-"}${Number(transaction.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
