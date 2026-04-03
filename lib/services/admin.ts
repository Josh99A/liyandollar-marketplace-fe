import { apiClient } from "@/lib/api/client";
import type {
  ApiUser,
  CredentialsRecord,
  DepositRequest,
  Order,
  PaymentAsset,
  Product,
} from "@/types";

type AdminProductApi = {
  id: number;
  title: string;
  slug: string;
  category: string;
  subcategory?: string;
  category_icon?: string | null;
  subcategory_icon?: string | null;
  description: string;
  image: string | null;
  price_usd: string | number;
  rating?: string | number;
  status: string;
  stock_count: number;
  single_item: boolean;
  credentials_data: CredentialsRecord | CredentialsRecord[];
};

type AdminOrderApi = Omit<Order, "id" | "amount_expected"> & {
  id: number;
  amount_expected: string | number;
  selected_payment_asset: (PaymentAsset & { id: number }) | null;
};

type AdminPaymentAssetApi = PaymentAsset & { id: number; is_active: boolean };

function productGradient(index: number) {
  const gradients = [
    "from-sky-500 via-blue-600 to-indigo-700",
    "from-cyan-400 via-sky-500 to-blue-700",
    "from-emerald-400 via-teal-500 to-cyan-700",
    "from-violet-500 via-fuchsia-600 to-rose-600",
    "from-amber-400 via-orange-500 to-red-600",
    "from-slate-500 via-slate-700 to-slate-900",
  ];
  return gradients[index % gradients.length];
}

function mapProduct(product: AdminProductApi, index = 0): Product {
  return {
    id: String(product.id),
    slug: product.slug,
    name: product.title,
    category: product.category,
    subcategory: product.subcategory ?? undefined,
    categoryIcon: product.category_icon ?? null,
    subcategoryIcon: product.subcategory_icon ?? null,
    description: product.description,
    longDescription: product.description,
    image: product.image,
    price: Number(product.price_usd),
    rating: product.rating !== undefined ? Number(product.rating) : 4.8,
    stockStatus: `${product.status} (${product.stock_count})`,
    statusValue: product.status,
    stockCount: product.stock_count,
    singleItem: product.single_item,
    delivery: "After admin payment confirmation",
  tags: [product.category.toLowerCase()],
  credentialsPreview: "Protected until order is paid",
  credentialsData: product.credentials_data,
  gradient: productGradient(index),
  featured: false,
  };
}

function mapOrder(order: AdminOrderApi): Order {
  return {
    ...order,
    id: String(order.id),
    amount_expected: Number(order.amount_expected),
    selected_payment_asset: order.selected_payment_asset
      ? { ...order.selected_payment_asset, id: String(order.selected_payment_asset.id) }
      : null,
  };
}

export async function getAdminProducts() {
  const response = await apiClient.get<AdminProductApi[]>("/api/admin/products/");
  return response.data.map(mapProduct);
}

export async function createAdminProduct(payload: {
  title: string;
  slug: string;
  category: string;
  subcategory?: string;
  category_icon?: File | null;
  subcategory_icon?: File | null;
  description: string;
  price_usd: number;
  rating?: number;
  status: string;
  stock_count: number;
  single_item: boolean;
  credentials_data: CredentialsRecord | CredentialsRecord[];
  image?: File | null;
}) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("slug", payload.slug);
  formData.append("category", payload.category);
  if (payload.subcategory) {
    formData.append("subcategory", payload.subcategory);
  }
  if (payload.category_icon) {
    formData.append("category_icon", payload.category_icon);
  }
  if (payload.subcategory_icon) {
    formData.append("subcategory_icon", payload.subcategory_icon);
  }
  formData.append("description", payload.description);
  formData.append("price_usd", String(payload.price_usd));
  if (payload.rating !== undefined) {
    formData.append("rating", String(payload.rating));
  }
  formData.append("status", payload.status);
  formData.append("stock_count", String(payload.stock_count));
  formData.append("single_item", String(payload.single_item));
  formData.append("credentials_data", JSON.stringify(payload.credentials_data));
  if (payload.image) {
    formData.append("image", payload.image);
  }
  const response = await apiClient.post<AdminProductApi>("/api/admin/products/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapProduct(response.data);
}

export async function updateAdminProduct(
  id: string,
  payload: {
    title: string;
    slug: string;
    category: string;
    subcategory?: string;
    category_icon?: File | null;
    subcategory_icon?: File | null;
    description: string;
    price_usd: number;
    rating?: number;
    status: string;
    stock_count: number;
    single_item: boolean;
    credentials_data: CredentialsRecord | CredentialsRecord[];
    image?: File | null;
  },
) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("slug", payload.slug);
  formData.append("category", payload.category);
  formData.append("subcategory", payload.subcategory ?? "");
  if (payload.category_icon) {
    formData.append("category_icon", payload.category_icon);
  }
  if (payload.subcategory_icon) {
    formData.append("subcategory_icon", payload.subcategory_icon);
  }
  formData.append("description", payload.description);
  formData.append("price_usd", String(payload.price_usd));
  if (payload.rating !== undefined) {
    formData.append("rating", String(payload.rating));
  }
  formData.append("status", payload.status);
  formData.append("stock_count", String(payload.stock_count));
  formData.append("single_item", String(payload.single_item));
  formData.append("credentials_data", JSON.stringify(payload.credentials_data));
  if (payload.image) {
    formData.append("image", payload.image);
  }
  const response = await apiClient.put<AdminProductApi>(`/api/admin/products/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapProduct(response.data);
}

export async function deleteAdminProduct(id: string) {
  await apiClient.delete(`/api/admin/products/${id}/`);
}

export async function getAdminPaymentAssets() {
  const response = await apiClient.get<AdminPaymentAssetApi[]>("/api/admin/payment-assets/");
  return response.data.map((asset) => ({ ...asset, id: String(asset.id) }));
}

export async function createAdminPaymentAsset(payload: FormData) {
  const response = await apiClient.post<AdminPaymentAssetApi>("/api/admin/payment-assets/", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { ...response.data, id: String(response.data.id) };
}

export async function updateAdminPaymentAsset(id: string, payload: FormData) {
  const response = await apiClient.put<AdminPaymentAssetApi>(`/api/admin/payment-assets/${id}/`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { ...response.data, id: String(response.data.id) };
}

export async function deleteAdminPaymentAsset(id: string) {
  await apiClient.delete(`/api/admin/payment-assets/${id}/`);
}

export async function getAdminOrders() {
  const response = await apiClient.get<AdminOrderApi[]>("/api/admin/orders/");
  return response.data.map(mapOrder);
}

export async function setAdminOrderStatus(id: string, status: string) {
  const response = await apiClient.post<AdminOrderApi>(`/api/admin/orders/${id}/set-status/`, { status });
  return mapOrder(response.data);
}

export async function getAdminUsers() {
  const response = await apiClient.get<ApiUser[]>("/api/admin/users/");
  return response.data;
}

export async function updateAdminUserRole(
  id: number,
  payload: { is_staff: boolean; is_active: boolean },
) {
  const response = await apiClient.patch<ApiUser>(`/api/admin/users/${id}/set-role/`, payload);
  return response.data;
}

export async function updateAdminUser(
  id: number,
  payload: Partial<Pick<ApiUser, "username" | "email" | "first_name" | "last_name" | "is_staff" | "is_active">>,
) {
  const response = await apiClient.patch<ApiUser>(`/api/admin/users/${id}/`, payload);
  return response.data;
}

export async function getAdminWalletDeposits() {
  const response = await apiClient.get<DepositRequest[]>("/api/admin/wallet-deposits/");
  return response.data.map((deposit) => ({
    ...deposit,
    amount: Number(deposit.amount),
  }));
}

export async function confirmAdminWalletDeposit(id: number, admin_note = "") {
  const response = await apiClient.post<DepositRequest>(
    `/api/admin/wallet-deposits/${id}/confirm/`,
    { admin_note },
  );
  return {
    ...response.data,
    amount: Number(response.data.amount),
  };
}

export async function rejectAdminWalletDeposit(id: number, admin_note = "") {
  const response = await apiClient.post<DepositRequest>(
    `/api/admin/wallet-deposits/${id}/reject/`,
    { admin_note },
  );
  return {
    ...response.data,
    amount: Number(response.data.amount),
  };
}

// Withdrawal admin workflow removed.
