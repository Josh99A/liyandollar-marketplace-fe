/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, LoaderCircle, Shield, Trash2, Users, Wallet2 } from "lucide-react";
import toast from "react-hot-toast";
import { SectionHeading } from "@/components/ui/section-heading";
import { useAuthStore } from "@/stores/use-auth-store";
import {
  approveAdminWalletWithdrawal,
  completeAdminWalletWithdrawal,
  confirmAdminWalletDeposit,
  createAdminPaymentAsset,
  createAdminProduct,
  deleteAdminPaymentAsset,
  deleteAdminProduct,
  getAdminWalletDeposits,
  getAdminWalletWithdrawals,
  getAdminOrders,
  getAdminPaymentAssets,
  getAdminProducts,
  getAdminUsers,
  rejectAdminWalletDeposit,
  rejectAdminWalletWithdrawal,
  setAdminOrderStatus,
  updateAdminPaymentAsset,
  updateAdminProduct,
  updateAdminUser,
} from "@/lib/services/admin";
import type { ApiUser, DepositRequest, Order, PaymentAsset, Product, WithdrawalRequest } from "@/types";

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function AdminDashboardClient() {
  const router = useRouter();
  const { user, hasBootstrapped } = useAuthStore();
  const [tab, setTab] = useState<"products" | "payments" | "orders" | "users" | "wallet">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentAssets, setPaymentAssets] = useState<(PaymentAsset & { is_active?: boolean })[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [depositNotes, setDepositNotes] = useState<Record<number, string>>({});
  const [withdrawalNotes, setWithdrawalNotes] = useState<Record<number, string>>({});
  const [productForm, setProductForm] = useState({
    id: "",
    title: "",
    slug: "",
    category: "",
    description: "",
    price_usd: 0,
    status: "available",
    stock_count: 1,
    single_item: false,
    credentials_json: '{\n  "email": "",\n  "password": ""\n}',
    image: null as File | null,
    existingImage: null as string | null,
  });
  const [assetForm, setAssetForm] = useState({
    id: "",
    name: "",
    symbol: "",
    network: "",
    wallet_address: "",
    instructions: "",
    display_order: 0,
    is_active: true,
    qr_code_image: null as File | null,
  });
  const [userForm, setUserForm] = useState({
    id: 0,
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    is_staff: false,
    is_active: true,
  });

  useEffect(() => {
    if (!hasBootstrapped) return;
    if (!user?.is_staff) {
      router.replace("/dashboard");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [productsRes, assetsRes, ordersRes, usersRes, depositsRes, withdrawalsRes] = await Promise.all([
          getAdminProducts(),
          getAdminPaymentAssets(),
          getAdminOrders(),
          getAdminUsers(),
          getAdminWalletDeposits(),
          getAdminWalletWithdrawals(),
        ]);
        setProducts(productsRes);
        setPaymentAssets(assetsRes);
        setOrders(ordersRes);
        setUsers(usersRes);
        setDeposits(depositsRes);
        setWithdrawals(withdrawalsRes);
      } catch {
        setError("Unable to load admin workspace.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [hasBootstrapped, router, user]);

  const stats = useMemo(
    () => [
      { label: "Products", value: products.length },
      { label: "Payment Assets", value: paymentAssets.length },
      { label: "Pending Orders", value: orders.filter((order) => order.status !== "paid").length },
      { label: "Pending Deposits", value: deposits.filter((deposit) => deposit.status === "pending").length },
      { label: "Pending Withdrawals", value: withdrawals.filter((withdrawal) => withdrawal.status === "pending").length },
      { label: "Users", value: users.length },
    ],
    [orders, paymentAssets.length, products.length, users.length, deposits, withdrawals],
  );

  if (!hasBootstrapped || loading) {
    return (
      <div className="flex items-center gap-3 rounded-[1.75rem] border border-border bg-card/90 p-6">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm text-muted">Loading admin workspace...</p>
      </div>
    );
  }

  if (!user?.is_staff) {
    return null;
  }

  const resetProductForm = () =>
    setProductForm({
      id: "",
      title: "",
      slug: "",
      category: "",
      description: "",
      price_usd: 0,
      status: "available",
      stock_count: 1,
      single_item: false,
      credentials_json: '{\n  "email": "",\n  "password": ""\n}',
      image: null,
      existingImage: null,
    });

  const resetAssetForm = () =>
    setAssetForm({
      id: "",
      name: "",
      symbol: "",
      network: "",
      wallet_address: "",
      instructions: "",
      display_order: 0,
      is_active: true,
      qr_code_image: null,
    });

  const resetUserForm = () =>
    setUserForm({
      id: 0,
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      is_staff: false,
      is_active: true,
    });

  const saveProduct = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title: productForm.title,
        slug: productForm.slug,
        category: productForm.category,
        description: productForm.description,
        price_usd: productForm.price_usd,
        status: productForm.status,
        stock_count: productForm.stock_count,
        single_item: productForm.single_item,
        credentials_data: JSON.parse(productForm.credentials_json),
        image: productForm.image,
      };
      const saved = productForm.id
        ? await updateAdminProduct(productForm.id, payload)
        : await createAdminProduct(payload);
      setProducts((current) => {
        const next = current.filter((item) => item.id !== saved.id);
        return [saved, ...next];
      });
      setMessage("Product saved.");
      toast.success("Product saved.");
      resetProductForm();
    } catch {
      setError("Unable to save product. Make sure the credentials JSON is valid.");
      toast.error("Unable to save product.");
    } finally {
      setBusy(false);
    }
  };

  const saveUser = async () => {
    if (!userForm.id) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateAdminUser(userForm.id, {
        username: userForm.username,
        email: userForm.email,
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        is_staff: userForm.is_staff,
        is_active: userForm.is_active,
      });
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setUserForm((current) => ({ ...current, ...updated }));
      setMessage("User updated.");
      toast.success("User updated.");
    } catch {
      setError("Unable to update user.");
      toast.error("Unable to update user.");
    } finally {
      setBusy(false);
    }
  };

  const saveAsset = async () => {
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("method_type", "crypto");
      formData.append("name", assetForm.name);
      formData.append("symbol", assetForm.symbol);
      formData.append("network", assetForm.network);
      formData.append("wallet_address", assetForm.wallet_address);
      formData.append("instructions", assetForm.instructions);
      formData.append("display_order", String(assetForm.display_order));
      formData.append("is_active", String(assetForm.is_active));
      if (assetForm.qr_code_image) {
        formData.append("qr_code_image", assetForm.qr_code_image);
      }

      const saved = assetForm.id
        ? await updateAdminPaymentAsset(assetForm.id, formData)
        : await createAdminPaymentAsset(formData);
      setPaymentAssets((current) => {
        const next = current.filter((item) => item.id !== saved.id);
        return [...next, saved];
      });
      setMessage("Payment asset saved.");
      toast.success("Payment asset saved.");
      resetAssetForm();
    } catch {
      setError("Unable to save payment asset.");
      toast.error("Unable to save payment asset.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin Dashboard"
        title="Manage inventory, payment methods, orders, and users in-app"
        description="This workspace replaces direct Django admin usage and gives staff a cleaner marketplace-focused control panel."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[1.5rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["products", "Products"],
          ["payments", "Payment Assets"],
          ["orders", "Orders"],
          ["wallet", "Wallet Requests"],
          ["users", "Users"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value as typeof tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === value ? "bg-primary text-white" : "border border-border bg-card text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger)]">{error}</div> : null}

      {tab === "products" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold">Product form</h2>
            <div className="mt-5 grid gap-4">
              {[
                ["title", "Title"],
                ["slug", "Slug"],
                ["category", "Category"],
              ].map(([key, label]) => (
                <label key={key} className="space-y-2 text-sm font-medium">
                  <span>{label}</span>
                  <input
                    value={productForm[key as keyof typeof productForm] as string}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, [key]: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
              ))}
              <label className="space-y-2 text-sm font-medium">
                <span>Description</span>
                <textarea
                  rows={4}
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Product image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      image: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm outline-none focus:border-primary"
                />
                {productForm.existingImage ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg/50 p-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-border bg-card">
                      <img
                        src={productForm.existingImage}
                        alt={productForm.title || "Current product image"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-muted">
                      <p>Current uploaded image</p>
                      <p>Choose a new file only if you want to replace it.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-bg/40 p-3 text-xs text-muted">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Products without an uploaded image will use a category icon in marketplace listings.
                  </div>
                )}
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm font-medium">
                  <span>Price USD</span>
                  <input
                    type="number"
                    value={productForm.price_usd}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, price_usd: Number(event.target.value) }))
                    }
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Status</span>
                  <select
                    value={productForm.status}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, status: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Stock</span>
                  <input
                    type="number"
                    value={productForm.stock_count}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, stock_count: Number(event.target.value) }))
                    }
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
              </div>
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={productForm.single_item}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, single_item: event.target.checked }))
                  }
                />
                Single-item inventory
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Credentials JSON</span>
                <textarea
                  rows={8}
                  value={productForm.credentials_json}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, credentials_json: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 font-mono text-sm outline-none focus:border-primary"
                />
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={saveProduct} disabled={busy} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">
                  {busy ? "Saving..." : productForm.id ? "Update product" : "Create product"}
                </button>
                <button type="button" onClick={resetProductForm} className="rounded-full border border-border px-5 py-3 text-sm font-semibold">
                  Clear
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold">Products</h2>
            <div className="mt-5 grid gap-4">
              {products.map((product) => (
                <article key={product.id} className="rounded-3xl border border-border bg-bg/50 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-card">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-primary">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary">{product.category}</p>
                        <h3 className="mt-1 text-lg font-semibold">{product.name}</h3>
                        <p className="mt-2 text-sm text-muted">${product.price.toFixed(2)} • {product.stockStatus}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm({
                            id: product.id,
                            title: product.name,
                            slug: product.slug,
                            category: product.category,
                            description: product.description,
                            price_usd: product.price,
                            status: product.statusValue ?? "available",
                            stock_count: product.stockCount ?? 1,
                            single_item: product.singleItem ?? false,
                            credentials_json: JSON.stringify(product.credentialsData ?? {}, null, 2),
                            image: null,
                            existingImage: product.image,
                          })
                        }
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteAdminProduct(product.id);
                          setProducts((current) => current.filter((item) => item.id !== product.id));
                          toast.success("Product deleted.");
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "payments" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold">Payment asset form</h2>
            <div className="mt-5 grid gap-4">
              {[
                ["name", "Name"],
                ["symbol", "Symbol"],
                ["network", "Network"],
                ["wallet_address", "Wallet address"],
              ].map(([key, label]) => (
                <label key={key} className="space-y-2 text-sm font-medium">
                  <span>{label}</span>
                  <input
                    value={assetForm[key as keyof typeof assetForm] as string}
                    onChange={(event) => setAssetForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
              ))}
              <label className="space-y-2 text-sm font-medium">
                <span>Instructions</span>
                <textarea
                  rows={5}
                  value={assetForm.instructions}
                  onChange={(event) => setAssetForm((current) => ({ ...current, instructions: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  <span>Display order</span>
                  <input
                    type="number"
                    value={assetForm.display_order}
                    onChange={(event) => setAssetForm((current) => ({ ...current, display_order: Number(event.target.value) }))}
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>QR code image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setAssetForm((current) => ({ ...current, qr_code_image: event.target.files?.[0] ?? null }))}
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm"
                  />
                </label>
              </div>
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={assetForm.is_active}
                  onChange={(event) => setAssetForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                Active checkout asset
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={saveAsset} disabled={busy} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">
                  {busy ? "Saving..." : assetForm.id ? "Update asset" : "Create asset"}
                </button>
                <button type="button" onClick={resetAssetForm} className="rounded-full border border-border px-5 py-3 text-sm font-semibold">
                  Clear
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold">Payment assets</h2>
            <div className="mt-5 grid gap-4">
              {paymentAssets.map((asset) => (
                <article key={asset.id} className="rounded-3xl border border-border bg-bg/50 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary">{asset.symbol}</p>
                      <h3 className="mt-1 text-lg font-semibold">{asset.name}</h3>
                      <p className="mt-2 text-sm text-muted">{asset.network} • {asset.is_active ? "Active" : "Inactive"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setAssetForm({
                            id: asset.id,
                            name: asset.name,
                            symbol: asset.symbol,
                            network: asset.network,
                            wallet_address: asset.wallet_address,
                            instructions: asset.instructions,
                            display_order: asset.display_order,
                            is_active: Boolean(asset.is_active),
                            qr_code_image: null,
                          })
                        }
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteAdminPaymentAsset(asset.id);
                          setPaymentAssets((current) => current.filter((item) => item.id !== asset.id));
                          toast.success("Payment asset deleted.");
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "orders" ? (
        <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold">Order review queue</h2>
          <div className="mt-5 grid gap-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-3xl border border-border bg-bg/50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <StatusPill value={order.status} />
                    <h3 className="mt-3 text-lg font-semibold">{order.product.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {order.user ? `${order.user.username || order.user.email} • ` : ""}Ref: {order.reference}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["pending", "awaiting_confirmation", "paid", "failed", "cancelled"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={async () => {
                          const updated = await setAdminOrderStatus(order.id, status);
                          setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                          setMessage(`Order ${order.reference} marked ${status}.`);
                          toast.success(`Order marked ${status.replaceAll("_", " ")}.`);
                        }}
                        className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${order.status === status ? "bg-primary text-white" : "border border-border bg-card text-muted"}`}
                      >
                        {status.replaceAll("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "wallet" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted">Deposits</p>
                <h2 className="mt-2 text-xl font-semibold">Deposit review queue</h2>
              </div>
              <div className="rounded-2xl bg-accent p-3 text-primary">
                <Wallet2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              {deposits.length === 0 ? (
                <div className="rounded-2xl border border-border bg-bg/60 p-4 text-sm text-muted">
                  No deposit requests yet.
                </div>
              ) : (
                deposits.map((deposit) => (
                  <article key={deposit.id} className="rounded-3xl border border-border bg-bg/50 p-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <StatusPill value={deposit.status} />
                        <h3 className="mt-3 text-lg font-semibold">${deposit.amount.toFixed(2)} deposit</h3>
                        <p className="mt-1 text-sm text-muted">
                          {deposit.crypto_asset.name} • {deposit.crypto_asset.network}
                        </p>
                        {deposit.tx_hash ? (
                          <p className="mt-2 text-xs text-muted">Tx hash: {deposit.tx_hash}</p>
                        ) : null}
                      </div>
                      <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                        <span>Admin note (optional)</span>
                        <input
                          value={depositNotes[deposit.id] ?? ""}
                          onChange={(event) =>
                            setDepositNotes((current) => ({ ...current, [deposit.id]: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm font-medium normal-case text-foreground outline-none focus:border-primary"
                          placeholder="Add a note for the customer"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = await confirmAdminWalletDeposit(
                              deposit.id,
                              depositNotes[deposit.id] ?? "",
                            );
                            setDeposits((current) =>
                              current.map((item) => (item.id === updated.id ? updated : item)),
                            );
                            toast.success("Deposit confirmed.");
                          }}
                          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = await rejectAdminWalletDeposit(
                              deposit.id,
                              depositNotes[deposit.id] ?? "",
                            );
                            setDeposits((current) =>
                              current.map((item) => (item.id === updated.id ? updated : item)),
                            );
                            toast.success("Deposit rejected.");
                          }}
                          className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted">Withdrawals</p>
                <h2 className="mt-2 text-xl font-semibold">Withdrawal review queue</h2>
              </div>
              <div className="rounded-2xl bg-accent p-3 text-primary">
                <Wallet2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              {withdrawals.length === 0 ? (
                <div className="rounded-2xl border border-border bg-bg/60 p-4 text-sm text-muted">
                  No withdrawal requests yet.
                </div>
              ) : (
                withdrawals.map((withdrawal) => (
                  <article key={withdrawal.id} className="rounded-3xl border border-border bg-bg/50 p-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <StatusPill value={withdrawal.status} />
                        <h3 className="mt-3 text-lg font-semibold">${withdrawal.amount.toFixed(2)} withdrawal</h3>
                        <p className="mt-1 text-sm text-muted">
                          {withdrawal.network} • {withdrawal.destination_address}
                        </p>
                      </div>
                      <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                        <span>Admin note (optional)</span>
                        <input
                          value={withdrawalNotes[withdrawal.id] ?? ""}
                          onChange={(event) =>
                            setWithdrawalNotes((current) => ({ ...current, [withdrawal.id]: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm font-medium normal-case text-foreground outline-none focus:border-primary"
                          placeholder="Add a note for the customer"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = await approveAdminWalletWithdrawal(
                              withdrawal.id,
                              withdrawalNotes[withdrawal.id] ?? "",
                            );
                            setWithdrawals((current) =>
                              current.map((item) => (item.id === updated.id ? updated : item)),
                            );
                            toast.success("Withdrawal approved.");
                          }}
                          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = await completeAdminWalletWithdrawal(
                              withdrawal.id,
                              withdrawalNotes[withdrawal.id] ?? "",
                            );
                            setWithdrawals((current) =>
                              current.map((item) => (item.id === updated.id ? updated : item)),
                            );
                            toast.success("Withdrawal completed.");
                          }}
                          className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                        >
                          Mark completed
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = await rejectAdminWalletWithdrawal(
                              withdrawal.id,
                              withdrawalNotes[withdrawal.id] ?? "",
                            );
                            setWithdrawals((current) =>
                              current.map((item) => (item.id === updated.id ? updated : item)),
                            );
                            toast.success("Withdrawal rejected.");
                          }}
                          className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold">Edit user</h2>
            <p className="mt-2 text-sm text-muted">Select a user to edit their profile and access level.</p>
            <div className="mt-5 grid gap-4">
              {[
                ["username", "Username"],
                ["email", "Email"],
                ["first_name", "First name"],
                ["last_name", "Last name"],
              ].map(([key, label]) => (
                <label key={key} className="space-y-2 text-sm font-medium">
                  <span>{label}</span>
                  <input
                    value={userForm[key as keyof typeof userForm] as string}
                    onChange={(event) => setUserForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
              ))}
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={userForm.is_staff}
                  onChange={(event) => setUserForm((current) => ({ ...current, is_staff: event.target.checked }))}
                />
                Admin access
              </label>
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={userForm.is_active}
                  onChange={(event) => setUserForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                Active account
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveUser}
                  disabled={busy || !userForm.id}
                  className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={resetUserForm} className="rounded-full border border-border px-5 py-3 text-sm font-semibold">
                  Clear
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold">User management</h2>
            <div className="mt-5 grid gap-4">
              {users.map((managedUser) => (
                <article key={managedUser.id} className="rounded-3xl border border-border bg-bg/50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-accent p-3 text-primary">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{managedUser.username || managedUser.email}</h3>
                        <p className="text-sm text-muted">{managedUser.first_name} {managedUser.last_name} • {managedUser.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setUserForm({
                            id: managedUser.id,
                            username: managedUser.username,
                            email: managedUser.email,
                            first_name: managedUser.first_name,
                            last_name: managedUser.last_name,
                            is_staff: managedUser.is_staff,
                            is_active: managedUser.is_active ?? true,
                          })
                        }
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = await updateAdminUser(managedUser.id, {
                            is_staff: !managedUser.is_staff,
                          });
                          setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                          if (userForm.id === updated.id) {
                            setUserForm((current) => ({ ...current, is_staff: updated.is_staff }));
                          }
                          toast.success(managedUser.is_staff ? "Admin role removed." : "Admin role granted.");
                        }}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${managedUser.is_staff ? "bg-primary text-white" : "border border-border bg-card text-muted"}`}
                      >
                        <Shield className="h-4 w-4" />
                        {managedUser.is_staff ? "Admin" : "Make admin"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = await updateAdminUser(managedUser.id, {
                            is_active: !(managedUser.is_active ?? true),
                          });
                          setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                          if (userForm.id === updated.id) {
                            setUserForm((current) => ({ ...current, is_active: updated.is_active ?? true }));
                          }
                          toast.success((managedUser.is_active ?? true) ? "User deactivated." : "User activated.");
                        }}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${(managedUser.is_active ?? true) ? "border border-border bg-card text-muted" : "bg-rose-500/12 text-rose-700 dark:text-rose-200"}`}
                      >
                        {(managedUser.is_active ?? true) ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
