import { apiClient } from "@/lib/api/client";
import type { CredentialsResponse, Order, PaymentDetailsResponse, PaymentSubmission } from "@/types";

type OrderApi = Omit<Order, "id" | "amount_expected"> & {
  id: number;
  amount_expected: string | number;
  quantity?: number;
  selected_payment_asset: (Order["selected_payment_asset"] & { id: number }) | null;
};

function mapOrder(order: OrderApi): Order {
  return {
    ...order,
    id: String(order.id),
    amount_expected: Number(order.amount_expected),
    quantity: order.quantity ?? 1,
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

export async function createOrderWithQuantity(productId: string, quantity: number) {
  const response = await apiClient.post<OrderApi>("/api/orders/", {
    product_id: Number(productId),
    quantity,
  });
  return mapOrder(response.data);
}

type GuestOrderApi = Omit<Order, "id" | "amount_expected"> & {
  id: number;
  amount_expected: string | number;
  quantity?: number;
  selected_payment_asset: (Order["selected_payment_asset"] & { id: number }) | null;
};

function mapGuestOrder(order: GuestOrderApi): Order {
  return {
    ...order,
    id: String(order.id),
    amount_expected: Number(order.amount_expected),
    quantity: order.quantity ?? 1,
    selected_payment_asset: order.selected_payment_asset
      ? {
          ...order.selected_payment_asset,
          id: String(order.selected_payment_asset.id),
        }
      : null,
  };
}

export async function createGuestOrder(payload: {
  productId: string;
  guestName: string;
  guestEmail: string;
  paymentAssetId?: string | null;
  quantity?: number;
}) {
  const response = await apiClient.post<GuestOrderApi>("/api/guest/orders/", {
    product_id: Number(payload.productId),
    guest_name: payload.guestName,
    guest_email: payload.guestEmail,
    payment_asset_id: payload.paymentAssetId ? Number(payload.paymentAssetId) : undefined,
    quantity: payload.quantity ?? 1,
  });
  return mapGuestOrder(response.data);
}

export async function getGuestOrder(reference: string) {
  const response = await apiClient.get<GuestOrderApi>(`/api/guest/orders/${reference}/`);
  return mapGuestOrder(response.data);
}

export async function selectGuestPaymentAsset(reference: string, paymentAssetId: string) {
  const response = await apiClient.post<GuestOrderApi>(
    `/api/guest/orders/${reference}/select-payment-asset/`,
    {
      payment_asset_id: Number(paymentAssetId),
    },
  );
  return mapGuestOrder(response.data);
}

export async function getGuestPaymentDetails(reference: string) {
  const response = await apiClient.get<
    Omit<PaymentDetailsResponse, "order_id" | "asset"> & {
      order_id: number;
      asset: PaymentDetailsResponse["asset"] & { id: number };
    }
  >(
    `/api/guest/orders/${reference}/payment-details/`,
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

export async function submitGuestPayment(
  reference: string,
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
    order: GuestOrderApi;
    submission: PaymentSubmission;
    message: string;
  }>(`/api/guest/orders/${reference}/submit-payment/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return {
    ...response.data,
    order: mapGuestOrder(response.data.order),
  };
}

export async function getGuestCredentials(reference: string) {
  const response = await apiClient.get<CredentialsResponse>(
    `/api/guest/orders/${reference}/credentials/`,
  );
  return response.data;
}

export async function downloadGuestCredentialsPdf(reference: string) {
  const response = await apiClient.get<Blob>(
    `/api/guest/orders/${reference}/download-pdf/`,
    {
      responseType: "blob",
    },
  );
  return response.data;
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

export async function payOrderWithWallet(orderId: string) {
  const response = await apiClient.post<OrderApi>(
    `/api/orders/${orderId}/pay-with-wallet/`,
  );
  return mapOrder(response.data);
}
