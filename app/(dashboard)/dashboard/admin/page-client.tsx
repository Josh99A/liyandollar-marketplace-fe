/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, LoaderCircle, Shield, Trash2, Users } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { useAuthStore } from "@/stores/use-auth-store";
import {
  createAdminPaymentAsset,
  createAdminProduct,
  deleteAdminPaymentAsset,
  deleteAdminProduct,
  getAdminOrders,
  getAdminPaymentAssets,
  getAdminProducts,
  getAdminUsers,
  setAdminOrderStatus,
  updateAdminPaymentAsset,
  updateAdminProduct,
  updateAdminUserRole,
} from "@/lib/services/admin";
import type { ApiUser, Order, PaymentAsset, Product } from "@/types";

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
  const [tab, setTab] = useState<"products" | "payments" | "orders" | "users">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentAssets, setPaymentAssets] = useState<(PaymentAsset & { is_active?: boolean })[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!hasBootstrapped) return;
    if (!user?.is_staff) {
      router.replace("/dashboard");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [productsRes, assetsRes, ordersRes, usersRes] = await Promise.all([
          getAdminProducts(),
          getAdminPaymentAssets(),
          getAdminOrders(),
          getAdminUsers(),
        ]);
        setProducts(productsRes);
        setPaymentAssets(assetsRes);
        setOrders(ordersRes);
        setUsers(usersRes);
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
      { label: "Users", value: users.length },
    ],
    [orders, paymentAssets.length, products.length, users.length],
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
      resetProductForm();
    } catch {
      setError("Unable to save product. Make sure the credentials JSON is valid.");
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
      resetAssetForm();
    } catch {
      setError("Unable to save payment asset.");
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

      <div className="grid gap-4 md:grid-cols-4">
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
      {error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-200">{error}</div> : null}

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
                      {order.user ? `${order.user.email} • ` : ""}Ref: {order.reference}
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

      {tab === "users" ? (
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
                      <h3 className="text-lg font-semibold">{managedUser.email}</h3>
                      <p className="text-sm text-muted">{managedUser.first_name} {managedUser.last_name} • @{managedUser.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await updateAdminUserRole(managedUser.id, {
                          is_staff: !managedUser.is_staff,
                          is_active: managedUser.is_active ?? true,
                        });
                        setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                      }}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${managedUser.is_staff ? "bg-primary text-white" : "border border-border bg-card text-muted"}`}
                    >
                      <Shield className="h-4 w-4" />
                      {managedUser.is_staff ? "Admin" : "Make admin"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await updateAdminUserRole(managedUser.id, {
                          is_staff: managedUser.is_staff,
                          is_active: !(managedUser.is_active ?? true),
                        });
                        setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
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
      ) : null}
    </div>
  );
}
