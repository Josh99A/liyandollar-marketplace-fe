export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  image: string | null;
  price: number;
  rating: number;
  stockStatus: string;
  statusValue?: string;
  stockCount?: number;
  singleItem?: boolean;
  delivery: string;
  tags: string[];
  credentialsPreview: string;
  credentialsData?: Record<string, string>;
  gradient: string;
  featured: boolean;
};

export type ApiUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active?: boolean;
  date_joined?: string;
};

export type PaymentAsset = {
  id: string;
  method_type: string;
  name: string;
  symbol: string;
  network: string;
  wallet_address: string;
  qr_code_image: string | null;
  instructions: string;
  display_order: number;
};

export type PaymentSubmission = {
  id: number;
  tx_hash: string;
  sender_wallet_address: string;
  note: string;
  screenshot: string | null;
  submitted_at: string;
  review_status: string;
};

export type WalletSummary = {
  balance: number;
  totalDeposits: number;
  totalSpend: number;
};

export type WalletTransaction = {
  id: string;
  title: string;
  type: "deposit" | "purchase";
  amount: number;
  createdAt: string;
  status: string;
};

export type Order = {
  id: string;
  reference: string;
  user?: ApiUser | null;
  product: Product;
  amount_expected: number;
  selected_payment_asset: PaymentAsset | null;
  status: string;
  payment_submissions: PaymentSubmission[];
  created_at: string;
  updated_at: string;
};

export type PaymentDetailsResponse = {
  order_id: string;
  reference: string;
  status: string;
  asset: PaymentAsset;
};

export type CredentialsResponse = {
  credentials: Record<string, string>;
  unlocked_at: string;
};

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
  order: number | null;
};
