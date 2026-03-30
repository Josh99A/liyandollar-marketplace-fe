import { apiClient } from "@/lib/api/client";
import type { CredentialsResponse, Order, PaymentDetailsResponse, PaymentSubmission } from "@/types";

type OrderApi = Omit<Order, "id" | "amount_expected"> & {
  id: number;
  amount_expected: string | number;
  selected_payment_asset: (Order["selected_payment_asset"] & { id: number }) | null;
};

function mapOrder(order: OrderApi): Order {
  return {
    ...order,
    id: String(order.id),
    amount_expected: Number(order.amount_expected),
    selected_payment_asset: order.selected_payment_asset
      ? {
          ...order.selected_payment_asset,
          id: String(order.selected_payment_asset.id),
        }
      : null,
  };
}

export async function createOrder(productId: string) {
  const response = await apiClient.post<OrderApi>("/api/orders/", {
    product_id: Number(productId),
  });
  return mapOrder(response.data);
}

export async function getOrders() {
  const response = await apiClient.get<OrderApi[]>("/api/orders/");
  return response.data.map(mapOrder);
}

export async function getOrder(id: string) {
  const response = await apiClient.get<OrderApi>(`/api/orders/${id}/`);
  return mapOrder(response.data);
}

export async function selectPaymentAsset(orderId: string, paymentAssetId: string) {
  const response = await apiClient.post<OrderApi>(
    `/api/orders/${orderId}/select-payment-asset/`,
    {
      payment_asset_id: Number(paymentAssetId),
    },
  );
  return mapOrder(response.data);
}

export async function getPaymentDetails(orderId: string) {
  const response = await apiClient.get<
    Omit<PaymentDetailsResponse, "order_id" | "asset"> & {
      order_id: number;
      asset: PaymentDetailsResponse["asset"] & { id: number };
    }
  >(
    `/api/orders/${orderId}/payment-details/`,
  );
  return {
    ...response.data,
    order_id: String(response.data.order_id),
    asset: {
      ...response.data.asset,
      id: String(response.data.asset.id),
    },
  };
}

export async function submitPayment(
  orderId: string,
  payload: {
    tx_hash?: string;
    sender_wallet_address?: string;
    note?: string;
    screenshot?: File | null;
  },
) {
  const formData = new FormData();
  if (payload.tx_hash) formData.append("tx_hash", payload.tx_hash);
  if (payload.sender_wallet_address) {
    formData.append("sender_wallet_address", payload.sender_wallet_address);
  }
  if (payload.note) formData.append("note", payload.note);
  if (payload.screenshot) formData.append("screenshot", payload.screenshot);

  const response = await apiClient.post<{
    order: OrderApi;
    submission: PaymentSubmission;
    message: string;
  }>(`/api/orders/${orderId}/submit-payment/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return {
    ...response.data,
    order: mapOrder(response.data.order),
  };
}

export async function getCredentials(orderId: string) {
  const response = await apiClient.get<CredentialsResponse>(
    `/api/orders/${orderId}/credentials/`,
  );
  return response.data;
}

export async function downloadCredentialsPdf(orderId: string) {
  const response = await apiClient.get<Blob>(
    `/api/orders/${orderId}/download-pdf/`,
    {
      responseType: "blob",
    },
  );
  return response.data;
}
