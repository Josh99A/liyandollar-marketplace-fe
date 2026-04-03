"use client";

import Link from "next/link";
import { LoaderCircle, Wallet2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/ui/section-heading";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { WalletTransactionList } from "@/components/wallet/wallet-transaction-list";
import { getWallet, getWalletTransactions } from "@/lib/services/wallet";
import type { WalletSummary, WalletTransactionLog } from "@/types";

export function WalletClient() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [walletData, logs] = await Promise.all([
          getWallet(),
          getWalletTransactions(),
        ]);
        setWallet(walletData);
        setTransactions(logs);
      } catch (err) {
        console.error("Failed to load wallet overview", err);
        setError("Unable to load wallet data right now.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Wallet"
        title="Balance, deposits, withdrawals, and request tracking"
        description="Deposits and withdrawals are reviewed manually. Your balance updates only when admins confirm requests."
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/wallet/deposit"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5"
        >
          Deposit funds
        </Link>
        <Link
          href="/dashboard/wallet/logs"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold"
        >
          View logs
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-[1.75rem] border border-border bg-card/90 p-6">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted">Loading wallet overview...</p>
        </div>
      ) : error ? (
        <div className="rounded-[1.75rem] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-6 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : wallet ? (
        <>
          <WalletCard wallet={wallet} />
          <WalletTransactionList transactions={transactions} />
        </>
      ) : (
        <div className="rounded-[1.75rem] border border-border bg-card/90 p-6 text-sm text-muted">
          <div className="flex items-center gap-3">
            <Wallet2 className="h-5 w-5 text-primary" />
            Wallet data is unavailable.
          </div>
        </div>
      )}
    </div>
  );
}
