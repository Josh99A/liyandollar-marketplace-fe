import { apiClient } from "@/lib/api/client";
import type { PaymentAsset } from "@/types";

function mapPaymentAsset(asset: PaymentAsset & { id: number }) {
  return {
    ...asset,
    id: String(asset.id),
  };
}

export async function getPaymentAssets() {
  const response = await apiClient.get<(PaymentAsset & { id: number })[]>(
    "/api/payment-assets/",
  );
  return response.data.map(mapPaymentAsset);
}
