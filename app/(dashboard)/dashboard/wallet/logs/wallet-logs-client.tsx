"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDepositRequests, getWithdrawalRequests, getWalletTransactions } from "@/lib/services/wallet";
import type { DepositRequest, WalletTransactionLog, WithdrawalRequest } from "@/types";

type Tab = "deposits" | "withdrawals" | "transactions";

export function WalletLogsClient() {
  const [tab, setTab] = useState<Tab>("transactions");
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [transactions, setTransactions] = useState<WalletTransactionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [deps, withs, logs] = await Promise.all([
          getDepositRequests(),
          getWithdrawalRequests(),
          getWalletTransactions(),
        ]);
        setDeposits(deps);
        setWithdrawals(withs);
        setTransactions(logs);
      } catch {
        setError("Unable to load wallet logs.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const tabs = useMemo(
    () => [
      { id: "transactions" as const, label: "All transactions" },
      { id: "deposits" as const, label: "Deposits" },
      { id: "withdrawals" as const, label: "Withdrawals" },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Wallet logs"
        title="Track deposits, withdrawals, and balance changes"
        description="Every approved movement is logged to keep your account history auditable."
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === item.id ? "bg-primary text-white" : "border border-border bg-card text-muted"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-[1.75rem] border border-border bg-card/90 p-6">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted">Loading logs...</p>
        </div>
      ) : error ? (
        <div className="rounded-[1.75rem] border border-rose-400/30 bg-rose-500/10 p-6 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </div>
      ) : tab === "deposits" ? (
        <div className="space-y-4">
          {deposits.length === 0 ? (
            <div className="rounded-[1.75rem] border border-border bg-card/90 p-6 text-sm text-muted">
              No deposit requests yet.
            </div>
          ) : (
            deposits.map((deposit) => (
              <div key={deposit.id} className="rounded-3xl border border-border bg-bg/65 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  {deposit.crypto_asset.symbol}
                </p>
                <p className="mt-2 text-lg font-semibold">${deposit.amount.toFixed(2)}</p>
                <p className="text-sm text-muted">
                  {deposit.created_at} • {deposit.status}
                </p>
                {deposit.admin_note ? (
                  <p className="mt-2 text-sm text-muted">Admin note: {deposit.admin_note}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : tab === "withdrawals" ? (
        <div className="space-y-4">
          {withdrawals.length === 0 ? (
            <div className="rounded-[1.75rem] border border-border bg-card/90 p-6 text-sm text-muted">
              No withdrawal requests yet.
            </div>
          ) : (
            withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="rounded-3xl border border-border bg-bg/65 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  {withdrawal.network}
                </p>
                <p className="mt-2 text-lg font-semibold">${withdrawal.amount.toFixed(2)}</p>
                <p className="text-sm text-muted">
                  {withdrawal.created_at} • {withdrawal.status}
                </p>
                {withdrawal.admin_note ? (
                  <p className="mt-2 text-sm text-muted">Admin note: {withdrawal.admin_note}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="rounded-[1.75rem] border border-border bg-card/90 p-6 text-sm text-muted">
              No transactions yet.
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-3xl border border-border bg-bg/65 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  {transaction.transaction_type}
                </p>
                <p className="mt-2 text-lg font-semibold">${Number(transaction.amount).toFixed(2)}</p>
                <p className="text-sm text-muted">
                  {transaction.created_at} • {transaction.status}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
