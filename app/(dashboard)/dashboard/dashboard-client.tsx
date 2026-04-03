"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { PackageCheck, Timer, Wallet } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { getWallet, getWalletTransactions } from "@/lib/services/wallet";
import { getOrders } from "@/lib/services/orders";
import type { Order, WalletSummary, WalletTransactionLog } from "@/types";

export function DashboardClient() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingSecondary, setLoadingSecondary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingWallet(true);
      setError(null);
      try {
        const walletData = await getWallet();
        if (!active) return;
        setWallet(walletData);
      } catch (err) {
        console.error("Failed to load wallet summary", err);
        if (!active) return;
        setError("Unable to load your dashboard data.");
      } finally {
        if (active) {
          setLoadingWallet(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!wallet) return;
    let active = true;
    const loadSecondary = async () => {
      setLoadingSecondary(true);
      try {
        const [transactionData, orderData] = await Promise.all([
          getWalletTransactions(),
          getOrders(),
        ]);
        if (!active) return;
        startTransition(() => {
          setTransactions(transactionData);
          setOrders(orderData);
        });
      } catch (err) {
        console.error("Failed to load dashboard secondary data", err);
        if (!active) return;
        setError("Unable to load your dashboard data.");
      } finally {
        if (active) {
          setLoadingSecondary(false);
        }
      }
    };
    void loadSecondary();
    return () => {
      active = false;
    };
  }, [wallet]);

  const paidOrders = useMemo(
    () => orders.filter((order) => order.status === "paid"),
    [orders],
  );
  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status !== "paid"),
    [orders],
  );

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Dashboard"
        title="Your wallet, orders, and activity at a glance"
        description="Track wallet balance, payment requests, and confirmed orders from one secure hub."
      />

      {loadingWallet ? (
        <DashboardSkeleton />
      ) : null}

      {error ? (
        <div className="rounded-[1.75rem] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}

      {wallet ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Wallet balance",
                value: `$${wallet.balance.toFixed(2)}`,
                icon: Wallet,
              },
              {
                label: "Orders paid",
                value: loadingSecondary ? "—" : `${paidOrders.length}`,
                icon: PackageCheck,
              },
              {
                label: "Awaiting confirmation",
                value: loadingSecondary ? "—" : `${pendingOrders.length}`,
                icon: Timer,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="mb-4 inline-flex rounded-2xl bg-accent p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Quick access
                </p>
                <h2 className="mt-2 text-xl font-semibold">Need to top up your balance?</h2>
                <p className="mt-2 text-sm text-muted">
                  Start a deposit request in one step and come back here to track confirmation.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/wallet/deposit"
                  className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
                >
                  Deposit now
                </Link>
                <Link
                  href="/dashboard/wallet"
                  className="rounded-full border border-border px-5 py-3 text-sm font-semibold"
                >
                  View wallet
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <WalletCard wallet={wallet} />
            <TransactionList transactions={transactions.slice(0, 4)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
