import { apiClient } from "@/lib/api/client";
import type {
  DepositRequest,
  WalletAsset,
  WalletSummary,
  WalletTransactionLog,
} from "@/types";

type WalletSummaryResponse = {
  id: number;
  balance: string | number;
  currency_label: string;
  total_deposits: string | number;
  total_withdrawals: string | number;
};

function mapWalletSummary(payload: WalletSummaryResponse): WalletSummary {
  return {
    balance: Number(payload.balance),
    totalDeposits: Number(payload.total_deposits),
    totalWithdrawals: Number(payload.total_withdrawals),
  };
}

export async function getWallet() {
  const response = await apiClient.get<WalletSummaryResponse>("/api/wallet/");
  return mapWalletSummary(response.data);
}

export async function getDepositAssets() {
  const response = await apiClient.get<(WalletAsset & { id: number })[]>(
    "/api/wallet/deposit-assets/",
  );
  return response.data.map((asset) => ({ ...asset, id: String(asset.id) }));
}

export async function createDepositRequest(payload: {
  crypto_asset_id: string;
  amount: number;
  tx_hash?: string;
  note?: string;
}) {
  const response = await apiClient.post<DepositRequest>("/api/wallet/deposits/", payload);
  return {
    ...response.data,
    amount: Number(response.data.amount),
  };
}

export async function getDepositRequests() {
  const response = await apiClient.get<DepositRequest[]>("/api/wallet/deposits/");
  return response.data.map((deposit) => ({
    ...deposit,
    amount: Number(deposit.amount),
  }));
}

export async function getDepositRequest(id: number) {
  const response = await apiClient.get<DepositRequest>(`/api/wallet/deposits/${id}/`);
  return {
    ...response.data,
    amount: Number(response.data.amount),
  };
}

export async function getWalletTransactions() {
  const response = await apiClient.get<WalletTransactionLog[]>("/api/wallet/transactions/");
  return response.data.map((log) => ({
    ...log,
    amount: Number(log.amount),
    balance_before: Number(log.balance_before),
    balance_after: Number(log.balance_after),
  }));
}
