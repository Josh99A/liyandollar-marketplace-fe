import { DepositModalTrigger } from "@/components/dashboard/deposit-modal-trigger";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getTransactions, getWalletSummary } from "@/lib/services/account";

export default async function WalletPage() {
  const [wallet, transactions] = await Promise.all([
    getWalletSummary(),
    getTransactions(),
  ]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Wallet"
        title="Deposits, balance visibility, and transaction monitoring"
        description="The UI keeps payment actions isolated in reusable components and modals for maintainability."
      />
      <div className="flex justify-end">
        <DepositModalTrigger />
      </div>
      <WalletCard wallet={wallet} />
      <TransactionList transactions={transactions} />
    </div>
  );
}
