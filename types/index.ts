export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory?: string;
  categoryIcon?: string | null;
  subcategoryIcon?: string | null;
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
  credentialsData?: CredentialsRecord | CredentialsRecord[];
  gradient: string;
  featured: boolean;
};

export type CredentialsRecord = Record<string, string>;

export type ApiUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string | null;
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
  totalWithdrawals: number;
};

export type WalletTransaction = {
  id: string;
  title: string;
  type: "deposit" | "purchase";
  amount: number;
  createdAt: string;
  status: string;
};

export type WalletAsset = {
  id: string;
  name: string;
  symbol: string;
  network: string;
  wallet_address: string;
  qr_code: string | null;
  instructions: string;
};

export type DepositRequest = {
  id: number;
  amount: number;
  status: "pending" | "confirmed" | "rejected";
  tx_hash: string;
  note: string;
  crypto_asset: WalletAsset;
  created_at: string;
  admin_note: string;
};

export type WithdrawalRequest = {
  id: number;
  amount: number;
  destination_address: string;
  destination_qr_code: string | null;
  network: string;
  status: "pending" | "approved" | "rejected" | "completed";
  note: string;
  created_at: string;
  admin_note: string;
};

export type WalletTransactionLog = {
  id: number;
  transaction_type: "deposit" | "withdrawal" | "purchase";
  reference_type: "deposit_request" | "withdrawal_request" | "order";
  reference_id: number;
  amount: number;
  balance_before: number;
  balance_after: number;
  status: string;
  description: string;
  created_at: string;
};

export type Order = {
  id: string;
  reference: string;
  user?: ApiUser | null;
  guest_name?: string;
  guest_email?: string;
  product: Product;
  amount_expected: number;
  quantity?: number;
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
  credentials: CredentialsRecord | CredentialsRecord[];
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

export type SupportMessage = {
  id: number;
  sender_role: "user" | "guest" | "admin";
  sender_name: string | null;
  sender_email: string | null;
  message: string;
  created_at: string;
};

export type SupportTicket = {
  id: number;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  created_at: string;
  last_message?: string | null;
  last_message_at?: string | null;
  messages?: SupportMessage[];
};
