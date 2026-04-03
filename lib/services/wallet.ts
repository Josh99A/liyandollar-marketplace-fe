import { apiClient } from "@/lib/api/client";
import type {
  DepositRequest,
  PaymentAsset,
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
  const response = await apiClient.get<(PaymentAsset & { id: number; usd_rate: string | number })[]>(
    "/api/wallet/deposit-assets/",
  );
  return response.data.map((asset) => ({
    ...asset,
    id: String(asset.id),
    qr_code: asset.qr_code_image,
    usd_rate: Number(asset.usd_rate),
  }));
}

export async function createDepositRequest(payload: {
  payment_asset_id: string;
  amount: number;
  tx_hash?: string;
  note?: string;
}) {
  const response = await apiClient.post<DepositRequest>("/api/wallet/deposits/", payload);
  return {
    ...response.data,
    amount: Number(response.data.amount),
    asset_amount: response.data.asset_amount !== undefined && response.data.asset_amount !== null
      ? Number(response.data.asset_amount)
      : null,
    credited_amount_usd: response.data.credited_amount_usd !== undefined
      ? Number(response.data.credited_amount_usd)
      : undefined,
  };
}

export async function getDepositRequests() {
  const response = await apiClient.get<DepositRequest[]>("/api/wallet/deposits/");
  return response.data.map((deposit) => ({
    ...deposit,
    amount: Number(deposit.amount),
    asset_amount: deposit.asset_amount !== undefined && deposit.asset_amount !== null
      ? Number(deposit.asset_amount)
      : null,
    credited_amount_usd: deposit.credited_amount_usd !== undefined
      ? Number(deposit.credited_amount_usd)
      : undefined,
  }));
}

export async function getDepositRequest(id: number) {
  const response = await apiClient.get<DepositRequest>(`/api/wallet/deposits/${id}/`);
  return {
    ...response.data,
    amount: Number(response.data.amount),
    asset_amount: response.data.asset_amount !== undefined && response.data.asset_amount !== null
      ? Number(response.data.asset_amount)
      : null,
    credited_amount_usd: response.data.credited_amount_usd !== undefined
      ? Number(response.data.credited_amount_usd)
      : undefined,
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
