import { PackageCheck, TrendingUp, Wallet } from "lucide-react";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { SectionHeading } from "@/components/ui/section-heading";
import { getOrders, getTransactions, getWalletSummary } from "@/lib/services/account";

export default async function DashboardPage() {
  const [wallet, transactions, orders] = await Promise.all([
    getWalletSummary(),
    getTransactions(),
    getOrders(),
  ]);

  const stats = [
    {
      label: "Wallet balance",
      value: `$${wallet.balance.toFixed(2)}`,
      icon: Wallet,
    },
    {
      label: "Orders completed",
      value: `${orders.length}`,
      icon: PackageCheck,
    },
    {
      label: "Success rate",
      value: "99.2%",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Dashboard"
        title="A protected control center for customer finance and fulfillment"
        description="This area is structured for authenticated sessions only and keeps wallet, orders, and downloads modular."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4 inline-flex rounded-2xl bg-accent p-3 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <WalletCard wallet={wallet} />
        <TransactionList transactions={transactions.slice(0, 4)} />
      </div>
    </div>
  );
}
