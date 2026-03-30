import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import type { WalletTransaction } from "@/types";

export function TransactionList({
  transactions,
}: {
  transactions: WalletTransaction[];
}) {
  return (
    <section className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-primary">
            Transactions
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Recent activity</h2>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {transactions.map((transaction) => {
          const isDeposit = transaction.type === "deposit";

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
                  <p className="font-semibold">{transaction.title}</p>
                  <p className="text-sm text-muted">
                    {transaction.createdAt} • {transaction.status}
                  </p>
                </div>
              </div>
              <p className="text-lg font-semibold">
                {isDeposit ? "+" : "-"}${transaction.amount.toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
