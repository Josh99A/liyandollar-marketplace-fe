import { orders, transactions, walletSummary } from "@/lib/data/account";

export async function getWalletSummary() {
  return walletSummary;
}

export async function getTransactions() {
  return transactions;
}

export async function getOrders() {
  return orders;
}
