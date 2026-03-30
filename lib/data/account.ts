import type { Order, WalletSummary, WalletTransaction } from "@/types";

export const walletSummary: WalletSummary = {
  balance: 1240.5,
  totalDeposits: 3200,
  totalSpend: 1959.5,
};

export const transactions: WalletTransaction[] = [
  {
    id: "txn_1",
    title: "Wallet deposit",
    type: "deposit",
    amount: 500,
    createdAt: "Mar 20, 2026",
    status: "Completed",
  },
  {
    id: "txn_2",
    title: "Instagram Growth Account",
    type: "purchase",
    amount: 282.5,
    createdAt: "Mar 18, 2026",
    status: "Completed",
  },
  {
    id: "txn_3",
    title: "Wallet deposit",
    type: "deposit",
    amount: 1200,
    createdAt: "Mar 15, 2026",
    status: "Completed",
  },
  {
    id: "txn_4",
    title: "US Gift Card Bundle",
    type: "purchase",
    amount: 152.5,
    createdAt: "Mar 13, 2026",
    status: "Completed",
  },
  {
    id: "txn_5",
    title: "Business Gmail Suite",
    type: "purchase",
    amount: 98.5,
    createdAt: "Mar 11, 2026",
    status: "Completed",
  },
];

export const orders: Order[] = [
  {
    id: "ord_10391",
    productName: "Instagram Growth Account",
    status: "Delivered",
    deliveredAt: "Mar 18, 2026",
    total: 282.5,
    credentials: [
      { label: "Username", value: "growth.lifestyle.pro" },
      { label: "Password", value: "TempPass!934" },
      { label: "Recovery Email", value: "handoff@liyandollar.app" },
    ],
  },
  {
    id: "ord_10370",
    productName: "Business Gmail Suite",
    status: "Delivered",
    deliveredAt: "Mar 11, 2026",
    total: 98.5,
    credentials: [
      { label: "Email", value: "operations.bundle@gmail.com" },
      { label: "Password", value: "Gmail!Access82" },
      { label: "Recovery Code", value: "RCV-82XX-PQ91" },
    ],
  },
];
