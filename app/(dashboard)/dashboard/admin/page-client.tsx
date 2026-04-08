/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Gift,
  Globe,
  ImageIcon,
  LoaderCircle,
  Mail,
  Shield,
  Store,
  Trash2,
  Users,
  Wallet2,
} from "lucide-react";
import toast from "react-hot-toast";
import { SectionHeading } from "@/components/ui/section-heading";
import { AssetIcon } from "@/components/ui/crypto-icon";
import { useAuthStore } from "@/stores/use-auth-store";
import {
  confirmAdminWalletDeposit,
  createAdminPaymentAsset,
  createAdminProduct,
  deleteAdminPaymentAsset,
  deleteAdminProduct,
  getAdminWalletDeposits,
  getAdminOrders,
  getAdminPaymentAssets,
  getAdminProducts,
  getAdminUsers,
  rejectAdminWalletDeposit,
  setAdminOrderStatus,
  updateAdminPaymentAsset,
  updateAdminProduct,
  updateAdminUser,
} from "@/lib/services/admin";
import { normalizeCredentialsCollection } from "@/lib/utils/credentials";
import type { ApiUser, DepositRequest, Order, PaymentAsset, Product } from "@/types";

const CATEGORY_OPTIONS = [
  {
    label: "Social Accounts",
    description: "Facebook, Instagram, TikTok, X.",
    icon: Users,
    subcategories: [
      { label: "Facebook", icon: Globe },
      { label: "Instagram", icon: BadgeCheck },
      { label: "Twitter/X", icon: Shield },
      { label: "TikTok", icon: BadgeCheck },
      { label: "LinkedIn", icon: Users },
    ],
  },
  {
    label: "Email Accounts",
    description: "Gmail, Outlook, Yahoo.",
    icon: Mail,
    subcategories: [
      { label: "Gmail", icon: Mail },
      { label: "Outlook", icon: Mail },
      { label: "Yahoo", icon: Mail },
      { label: "Custom Domain", icon: Globe },
    ],
  },
  {
    label: "Gift Cards",
    description: "US, UK, Australia, Hong Kong.",
    icon: Gift,
    subcategories: [
      { label: "US", icon: Gift },
      { label: "UK", icon: Gift },
      { label: "Australia", icon: Gift },
      { label: "Hong Kong", icon: Gift },
    ],
  },
  {
    label: "Other",
    description: "Bundles, mixed assets.",
    icon: Store,
    subcategories: [
      { label: "Mixed", icon: Store },
      { label: "Bundles", icon: Store },
    ],
  },
];

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
      {value.replaceAll("_", " ")}
    </span>
  );
}

function formatErrorDetails(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

function formatLastLogin(value?: string | null) {
  if (!value) return "Never logged in";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function getLoginStatusStyles(lastLogin?: string | null) {
  if (!lastLogin) {
    return "bg-slate-900/10 text-foreground border border-slate-500/30";
  }
  const date = new Date(lastLogin);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 1000 * 60 * 60 * 24) {
    return "bg-emerald-500/15 text-foreground border border-emerald-500/30";
  }
  if (diffMs < 1000 * 60 * 60 * 24 * 7) {
    return "bg-amber-500/15 text-foreground border border-amber-500/30";
  }
  return "bg-rose-500/15 text-foreground border border-rose-500/30";
}

function slugifyProductTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  const [withdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [armedAction, setArmedAction] = useState<string | null>(null);
  const [depositNotes, setDepositNotes] = useState<Record<number, string>>({});
  const [productForm, setProductForm] = useState({
    id: "",
    title: "",
    slug: "",
    category: "",
    subcategory: "",
    description: "",
    price_usd: 0,
    rating: 4.8,
    status: "available",
    stock_count: 1,
    single_item: false,
    credentials_json:
      '[\n  {\n    "email": "",\n    "password": ""\n  }\n]',
    image: null as File | null,
    category_icon: null as File | null,
    subcategory_icon: null as File | null,
    existingImage: null as string | null,
    existingCategoryIcon: null as string | null,
    existingSubcategoryIcon: null as string | null,
  });
  const [productSlugManuallyEdited, setProductSlugManuallyEdited] = useState(false);
  const [assetForm, setAssetForm] = useState({
    id: "",
    name: "",
    symbol: "",
    network: "",
    wallet_address: "",
    instructions: "",
    display_order: 0,
    usd_rate: 1,
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
  const [categoryIconPreview, setCategoryIconPreview] = useState<string | null>(null);
  const [subcategoryIconPreview, setSubcategoryIconPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!productForm.category_icon) {
      setCategoryIconPreview(productForm.existingCategoryIcon);
      return;
    }
    const url = URL.createObjectURL(productForm.category_icon);
    setCategoryIconPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [productForm.category_icon, productForm.existingCategoryIcon]);

  useEffect(() => {
    if (!productForm.subcategory_icon) {
      setSubcategoryIconPreview(productForm.existingSubcategoryIcon);
      return;
    }
    const url = URL.createObjectURL(productForm.subcategory_icon);
    setSubcategoryIconPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [productForm.subcategory_icon, productForm.existingSubcategoryIcon]);

  useEffect(() => {
    if (productSlugManuallyEdited) return;
    const nextSlug = slugifyProductTitle(productForm.title);
    setProductForm((current) => (
      current.slug === nextSlug
        ? current
        : { ...current, slug: nextSlug }
    ));
  }, [productForm.title, productSlugManuallyEdited]);

  useEffect(() => {
    if (!armedAction) return;
    const timeout = window.setTimeout(() => setArmedAction(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [armedAction]);

  useEffect(() => {
    if (!hasBootstrapped) return;
    if (!user?.is_staff) {
      router.replace("/dashboard");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [productsRes, assetsRes, ordersRes, usersRes, depositsRes] = await Promise.all([
          getAdminProducts(),
          getAdminPaymentAssets(),
          getAdminOrders(),
          getAdminUsers(),
          getAdminWalletDeposits(),
        ]);
        setProducts(productsRes);
        setPaymentAssets(assetsRes);
        setOrders(ordersRes);
        setUsers(usersRes);
        setDeposits(depositsRes);
      } catch (err) {
        setError("Unable to load admin workspace.");
        setErrorDetails(formatErrorDetails(err));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [hasBootstrapped, router, user]);

  const stats = useMemo(
    () => [
      { label: "Products", value: products.length },
      { label: "Shared Assets", value: paymentAssets.length },
      { label: "Pending Orders", value: orders.filter((order) => order.status !== "paid").length },
      { label: "Pending Deposits", value: deposits.filter((deposit) => deposit.status === "pending").length },
      { label: "Users", value: users.length },
    ],
    [orders, paymentAssets.length, products.length, users.length, deposits],
  );

  const selectedCategory = useMemo(
    () => CATEGORY_OPTIONS.find((item) => item.label === productForm.category),
    [productForm.category],
  );
  const subcategoryOptions = selectedCategory?.subcategories ?? [];

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

  const resetProductForm = () => {
    setProductSlugManuallyEdited(false);
    setProductForm({
      id: "",
      title: "",
      slug: "",
      category: "",
      subcategory: "",
      description: "",
      price_usd: 0,
      rating: 4.8,
      status: "available",
      stock_count: 1,
      single_item: false,
      credentials_json:
        '[\n  {\n    "email": "",\n    "password": ""\n  }\n]',
      image: null,
      category_icon: null,
      subcategory_icon: null,
      existingImage: null,
      existingCategoryIcon: null,
      existingSubcategoryIcon: null,
    });
  };

  const resetAssetForm = () =>
    setAssetForm({
      id: "",
      name: "",
      symbol: "",
      network: "",
      wallet_address: "",
      instructions: "",
      display_order: 0,
      usd_rate: 1,
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

  const armSensitiveAction = (key: string, label: string) => {
    setArmedAction(key);
    toast(`${label}: click again to confirm.`, {
      icon: "⚠️",
    });
  };

  const updateUserInState = (id: number, changes: Partial<ApiUser>) => {
    setUsers((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
    if (userForm.id === id) {
      setUserForm((current) => ({ ...current, ...changes }));
    }
  };

  const saveProduct = async () => {
    setBusy(true);
    setError(null);
    setErrorDetails(null);
    try {
      const payload = {
        title: productForm.title,
        slug: productForm.slug,
        category: productForm.category,
        subcategory: productForm.subcategory || undefined,
        description: productForm.description,
        price_usd: productForm.price_usd,
        rating: productForm.rating,
        status: productForm.status,
        stock_count: productForm.stock_count,
        single_item: productForm.single_item,
        credentials_data: JSON.parse(productForm.credentials_json),
        image: productForm.image,
        category_icon: productForm.category_icon,
        subcategory_icon: productForm.subcategory_icon,
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
    } catch (err) {
      setError("Unable to save product. Make sure the credentials JSON is valid.");
      setErrorDetails(formatErrorDetails(err));
      toast.error("Unable to save product.");
    } finally {
      setBusy(false);
    }
  };

  const saveUser = async () => {
    if (!userForm.id) return;
    setBusy(true);
    setError(null);
    setErrorDetails(null);
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
    } catch (err) {
      setError("Unable to update user.");
      setErrorDetails(formatErrorDetails(err));
      toast.error("Unable to update user.");
    } finally {
      setBusy(false);
    }
  };

  const saveAsset = async () => {
    setBusy(true);
    setError(null);
    setErrorDetails(null);
    try {
      const formData = new FormData();
      formData.append("method_type", "crypto");
      formData.append("name", assetForm.name);
      formData.append("symbol", assetForm.symbol);
      formData.append("network", assetForm.network);
      formData.append("wallet_address", assetForm.wallet_address);
      formData.append("instructions", assetForm.instructions);
      formData.append("display_order", String(assetForm.display_order));
      formData.append("usd_rate", String(assetForm.usd_rate));
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
    } catch (err) {
      setError("Unable to save payment asset.");
      setErrorDetails(formatErrorDetails(err));
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

      {message ? <div className="rounded-2xl border border-[var(--color-success-border)] bg-[var(--color-success-soft)] p-4 text-sm text-[var(--color-success-foreground)]">{message}</div> : null}
      {error ? (
        <div className="rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger-foreground)]">
          <p>{error}</p>
          {errorDetails ? (
            <details className="mt-3 rounded-xl border border-[var(--color-danger-border)] bg-white/60 p-3 text-xs text-slate-700 dark:bg-slate-950/30 dark:text-slate-200">
              <summary className="cursor-pointer font-semibold text-[var(--color-danger-foreground)]">
                Debug details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap">{errorDetails}</pre>
            </details>
          ) : null}
        </div>
      ) : null}

      {tab === "products" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold">Product form</h2>
            <p className="mt-2 text-sm text-muted">
              Build the listing in steps so the basics, visuals, pricing, and protected credentials are easier to manage.
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.5rem] border border-border bg-bg/35 p-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Basics</p>
                  <h3 className="mt-2 text-lg font-semibold">Listing identity</h3>
                  <p className="mt-1 text-sm text-muted">Set the core catalog information and customer-facing description.</p>
                </div>
              {[
                ["title", "Title"],
                ["slug", "Slug"],
              ].map(([key, label]) => (
                <label key={key} className="space-y-2 text-sm font-medium">
                  <span>
                    {label}
                    {key === "title" ? <span className="text-rose-500"> *</span> : null}
                  </span>
                  <input
                    value={productForm[key as keyof typeof productForm] as string}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (key === "title") {
                        setProductForm((current) => ({ ...current, title: value }));
                        return;
                      }
                      setProductSlugManuallyEdited(true);
                      setProductForm((current) => ({ ...current, slug: slugifyProductTitle(value) }));
                    }}
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                    placeholder={key === "slug" ? "Auto-generated from the title" : undefined}
                    required={key === "title"}
                  />
                </label>
              ))}
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      Category<span className="text-rose-500"> *</span>
                    </p>
                    <p className="text-xs text-muted">Pick a core category or type a custom label.</p>
                  </div>
                  <span className="text-xs text-muted">Upload an icon below to override the default.</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {CATEGORY_OPTIONS.map(({ label, description, icon: Icon }) => {
                    const active = productForm.category === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          setProductForm((current) => ({
                            ...current,
                            category: label,
                            subcategory: "",
                          }))
                        }
                        className={`flex items-center gap-4 rounded-3xl border px-4 py-4 text-left text-sm font-semibold transition ${active ? "border-primary bg-accent/80 shadow-[var(--shadow-soft)]" : "border-border bg-bg/60 hover:border-primary/40"}`}
                        aria-pressed={active}
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-primary">
                          {active && categoryIconPreview ? (
                            <img
                              src={categoryIconPreview}
                              alt={`${label} icon`}
                              className="h-9 w-9 rounded-xl object-cover"
                            />
                          ) : (
                            <Icon className="h-6 w-6" />
                          )}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">{label}</span>
                          <span className="block text-xs text-muted">{description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <label className="space-y-2 text-sm font-medium">
                  <span>
                    Category label<span className="text-rose-500"> *</span>
                  </span>
                  <input
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, category: event.target.value }))
                    }
                    placeholder="Type a custom category if needed"
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                    required
                  />
                </label>
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Subcategory</p>
                    <p className="text-xs text-muted">Refine the listing with a platform or region.</p>
                  </div>
                  <span className="text-xs text-muted">Upload a subcategory icon to override.</span>
                </div>
                {subcategoryOptions.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {subcategoryOptions.map(({ label, icon: Icon }) => {
                      const active = productForm.subcategory === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            setProductForm((current) => ({ ...current, subcategory: label }))
                          }
                          className={`flex items-center gap-4 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${active ? "border-primary bg-accent/80 shadow-[var(--shadow-soft)]" : "border-border bg-bg/60 hover:border-primary/40"}`}
                          aria-pressed={active}
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card text-primary">
                            {active && subcategoryIconPreview ? (
                              <img
                                src={subcategoryIconPreview}
                                alt={`${label} icon`}
                                className="h-8 w-8 rounded-xl object-cover"
                              />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </span>
                          <span className="block text-sm font-semibold">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-bg/40 p-4 text-sm text-muted">
                    Select a category to see recommended subcategories.
                  </div>
                )}
                <label className="space-y-2 text-sm font-medium">
                  <span>Subcategory label</span>
                  <input
                    value={productForm.subcategory}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, subcategory: event.target.value }))
                    }
                    placeholder="Optional custom subcategory"
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm font-medium">
                <span>
                  Description<span className="text-rose-500"> *</span>
                </span>
                <textarea
                  rows={4}
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                  required
                />
              </label>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-bg/35 p-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Media</p>
                  <h3 className="mt-2 text-lg font-semibold">Visual presentation</h3>
                  <p className="mt-1 text-sm text-muted">Control the main image and the category icon fallbacks used around the marketplace.</p>
                </div>
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
              <label className="space-y-2 text-sm font-medium">
                <span>Category icon (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      category_icon: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm outline-none focus:border-primary"
                />
                {productForm.existingCategoryIcon ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg/50 p-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-border bg-card">
                      <img
                        src={productForm.existingCategoryIcon}
                        alt="Category icon"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-muted">Uploaded category icon</div>
                  </div>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Subcategory icon (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      subcategory_icon: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm outline-none focus:border-primary"
                />
                {productForm.existingSubcategoryIcon ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg/50 p-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-border bg-card">
                      <img
                        src={productForm.existingSubcategoryIcon}
                        alt="Subcategory icon"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-muted">Uploaded subcategory icon</div>
                  </div>
                ) : null}
              </label>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-bg/35 p-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Inventory</p>
                  <h3 className="mt-2 text-lg font-semibold">Pricing and availability</h3>
                  <p className="mt-1 text-sm text-muted">Define how the product is priced, displayed, and limited for purchase.</p>
                </div>
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <label className="min-w-0 space-y-2 text-sm font-medium">
                  <span className="block text-sm font-semibold text-foreground">
                    Price USD<span className="text-rose-500"> *</span>
                  </span>
                  <input
                    type="number"
                    value={productForm.price_usd}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, price_usd: Number(event.target.value) }))
                    }
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                    required
                  />
                </label>
                <label className="min-w-0 space-y-2 text-sm font-medium">
                  <span className="block text-sm font-semibold text-foreground">
                    Rating<span className="text-rose-500"> *</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={productForm.rating}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, rating: Number(event.target.value) }))
                    }
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                    required
                  />
                </label>
                <label className="min-w-0 space-y-2 text-sm font-medium">
                  <span className="block text-sm font-semibold text-foreground">
                    Status<span className="text-rose-500"> *</span>
                  </span>
                  <select
                    value={productForm.status}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, status: event.target.value }))
                    }
                    className="w-full min-w-0 rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                    required
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <label className="min-w-0 space-y-2 text-sm font-medium">
                  <span className="block text-sm font-semibold text-foreground">
                    Stock<span className="text-rose-500"> *</span>
                  </span>
                  <input
                    type="number"
                    value={productForm.stock_count}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, stock_count: Number(event.target.value) }))
                    }
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                    required
                  />
                </label>
              </div>
              <label className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card/50 px-4 py-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={productForm.single_item}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, single_item: event.target.checked }))
                  }
                  className="h-4 w-4"
                />
                Single-item inventory
              </label>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-bg/35 p-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Delivery</p>
                  <h3 className="mt-2 text-lg font-semibold">Protected credentials</h3>
                  <p className="mt-1 text-sm text-muted">Store the account details that unlock only after payment confirmation.</p>
                </div>
              <label className="space-y-2 text-sm font-medium">
                <span>
                  Credentials JSON<span className="text-rose-500"> *</span>
                </span>
                <p className="text-xs text-muted">
                  Add one credentials object for a single item, or an array of objects so each purchased instance has its own account details and PDF entry.
                </p>
                <textarea
                  rows={8}
                  value={productForm.credentials_json}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, credentials_json: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 font-mono text-sm outline-none focus:border-primary"
                  required
                />
              </label>
              </div>
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
                        ) : product.subcategoryIcon || product.categoryIcon ? (
                          <img
                            src={product.subcategoryIcon ?? product.categoryIcon ?? ""}
                            alt={`${product.name} icon`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-primary">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          {product.category}{product.subcategory ? ` | ${product.subcategory}` : ""}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold">{product.name}</h3>
                        <p className="mt-2 text-sm text-muted">${product.price.toFixed(2)} | {product.stockStatus}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProductSlugManuallyEdited(true);
                          setProductForm({
                            id: product.id,
                            title: product.name,
                            slug: product.slug,
                            category: product.category,
                            subcategory: product.subcategory ?? "",
                            description: product.description,
                            price_usd: product.price,
                            rating: product.rating ?? 4.8,
                            status: product.statusValue ?? "available",
                            stock_count: product.stockCount ?? 1,
                            single_item: product.singleItem ?? false,
                            credentials_json: JSON.stringify(
                              normalizeCredentialsCollection(product.credentialsData),
                              null,
                              2,
                            ),
                            image: null,
                            category_icon: null,
                            subcategory_icon: null,
                            existingImage: product.image,
                            existingCategoryIcon: product.categoryIcon ?? null,
                            existingSubcategoryIcon: product.subcategoryIcon ?? null,
                          });
                        }}
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
                      >
                        Edit
                      </button>
                      <a
                        href={`/products/${product.slug}`}
                        className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          const actionKey = `delete-product-${product.id}`;
                          if (armedAction !== actionKey) {
                            armSensitiveAction(actionKey, `Delete ${product.name}`);
                            return;
                          }
                          setArmedAction(null);
                          await deleteAdminProduct(product.id);
                          setProducts((current) => current.filter((item) => item.id !== product.id));
                          toast.success("Product deleted.");
                        }}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                          armedAction === `delete-product-${product.id}`
                            ? "border-rose-500 bg-rose-500 text-white"
                            : "border-rose-300 text-rose-600"
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                        {armedAction === `delete-product-${product.id}` ? "Confirm delete" : "Delete"}
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
                  <span>
                    {label}
                    <span className="text-rose-500"> *</span>
                  </span>
                  <input
                    value={assetForm[key as keyof typeof assetForm] as string}
                    onChange={(event) => setAssetForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                    required
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
                  <span>USD rate</span>
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={assetForm.usd_rate}
                    onChange={(event) => setAssetForm((current) => ({ ...current, usd_rate: Number(event.target.value) }))}
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
                Active shared payment and deposit asset
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
                    <div className="flex items-start gap-3">
                      {asset.qr_code_image ? (
                        <img
                          src={asset.qr_code_image}
                          alt={`${asset.name} QR`}
                          className="h-12 w-12 rounded-2xl border border-border object-cover"
                        />
                      ) : (
                        <AssetIcon symbol={asset.symbol} network={asset.network} size={48} />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-primary">{asset.symbol}</p>
                        <h3 className="mt-1 text-lg font-semibold">{asset.name}</h3>
                        <p className="mt-2 text-sm text-muted">{asset.network} | {asset.is_active ? "Active" : "Inactive"}</p>
                        <p className="mt-1 text-xs text-muted">1 {asset.symbol} = ${asset.usd_rate.toFixed(2)} USD</p>
                      </div>
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
                            usd_rate: asset.usd_rate,
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
                          const actionKey = `delete-asset-${asset.id}`;
                          if (armedAction !== actionKey) {
                            armSensitiveAction(actionKey, `Delete ${asset.name}`);
                            return;
                          }
                          setArmedAction(null);
                          await deleteAdminPaymentAsset(asset.id);
                          setPaymentAssets((current) => current.filter((item) => item.id !== asset.id));
                          toast.success("Payment asset deleted.");
                        }}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                          armedAction === `delete-asset-${asset.id}`
                            ? "border-rose-500 bg-rose-500 text-white"
                            : "border-rose-300 text-rose-600"
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                        {armedAction === `delete-asset-${asset.id}` ? "Confirm delete" : "Delete"}
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
                      {order.user ? `${order.user.username || order.user.email} | ` : ""}Ref: {order.reference}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["pending", "awaiting_confirmation", "paid", "failed", "cancelled"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={async () => {
                          if (order.status === status) return;
                          const actionKey = `order-status-${order.id}-${status}`;
                          if (armedAction !== actionKey) {
                            armSensitiveAction(actionKey, `Mark order ${order.reference} as ${status.replaceAll("_", " ")}`);
                            return;
                          }
                          setArmedAction(null);
                          const updated = await setAdminOrderStatus(order.id, status);
                          setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                          setMessage(`Order ${order.reference} marked ${status}.`);
                          toast.success(`Order marked ${status.replaceAll("_", " ")}.`);
                        }}
                        className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                          order.status === status
                            ? "bg-primary text-white"
                            : armedAction === `order-status-${order.id}-${status}`
                              ? "border border-amber-500 bg-amber-500 text-white"
                              : "border border-border bg-card text-muted"
                        }`}
                        disabled={order.status === status}
                      >
                        {armedAction === `order-status-${order.id}-${status}`
                          ? `Confirm ${status.replaceAll("_", " ")}`
                          : status.replaceAll("_", " ")}
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
        <div className="grid gap-6">
          <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div>
                <h2 className="text-xl font-semibold">Shared payment and deposit assets</h2>
                <p className="mt-2 text-sm text-muted">
                  Configure each asset once here. The same asset will appear on the deposit page and at checkout, and its USD rate controls how confirmed deposits convert into wallet balance.
                </p>
                <div className="mt-5 grid gap-4">
                  {[
                    ["name", "Asset name"],
                    ["symbol", "Symbol"],
                    ["network", "Network"],
                    ["wallet_address", "Wallet address"],
                  ].map(([key, label]) => (
                    <label key={key} className="space-y-2 text-sm font-medium">
                      <span>{label}</span>
                      <input
                        value={assetForm[key as keyof typeof assetForm] as string}
                        onChange={(event) =>
                          setAssetForm((current) => ({ ...current, [key]: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                      />
                    </label>
                  ))}
                  <label className="space-y-2 text-sm font-medium">
                    <span>Instructions</span>
                    <textarea
                      rows={3}
                      value={assetForm.instructions}
                      onChange={(event) =>
                        setAssetForm((current) => ({ ...current, instructions: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    <span>USD rate</span>
                    <input
                      type="number"
                      min="0"
                      step="0.000001"
                      value={assetForm.usd_rate}
                      onChange={(event) =>
                        setAssetForm((current) => ({ ...current, usd_rate: Number(event.target.value) }))
                      }
                      className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    <span>Display order</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={assetForm.display_order}
                      onChange={(event) =>
                        setAssetForm((current) => ({ ...current, display_order: Number(event.target.value) }))
                      }
                      className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    <span>QR code</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setAssetForm((current) => ({
                          ...current,
                          qr_code_image: event.target.files?.[0] ?? null,
                        }))
                      }
                      className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-3 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={assetForm.is_active}
                      onChange={(event) =>
                        setAssetForm((current) => ({ ...current, is_active: event.target.checked }))
                      }
                    />
                    Active shared checkout and deposit asset
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={saveAsset}
                      disabled={busy}
                      className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                    >
                      {busy ? "Saving..." : assetForm.id ? "Update shared asset" : "Create shared asset"}
                    </button>
                    <button
                      type="button"
                      onClick={resetAssetForm}
                      className="rounded-full border border-border px-5 py-3 text-sm font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Configured shared assets</h3>
                <div className="mt-5 grid gap-4">
                  {paymentAssets.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-bg/60 p-4 text-sm text-muted">
                      No shared assets yet. Create one here and it will immediately appear for deposits and checkout payments.
                    </div>
                  ) : (
                    paymentAssets.map((asset) => (
                      <article key={asset.id} className="rounded-3xl border border-border bg-bg/50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {asset.qr_code_image ? (
                              <img
                                src={asset.qr_code_image}
                                alt={`${asset.name} QR`}
                                className="h-14 w-14 rounded-2xl border border-border object-cover"
                              />
                            ) : (
                              <div className="rounded-2xl bg-accent p-3 text-primary">
                                <AssetIcon symbol={asset.symbol} network={asset.network} size={32} />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-primary">{asset.symbol}</p>
                              <h3 className="mt-1 text-lg font-semibold">{asset.name}</h3>
                              <p className="mt-2 text-sm text-muted">
                                {asset.network} | {asset.is_active ? "Active" : "Inactive"}
                              </p>
                              <p className="mt-1 text-xs text-muted">1 {asset.symbol} = ${(asset.usd_rate ?? 0).toFixed(2)} USD</p>
                              <p className="mt-2 break-all text-xs text-muted">{asset.wallet_address}</p>
                            </div>
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
                                  usd_rate: asset.usd_rate ?? 1,
                                  display_order: asset.display_order ?? 0,
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
                                const actionKey = `delete-shared-asset-${asset.id}`;
                                if (armedAction !== actionKey) {
                                  armSensitiveAction(actionKey, `Delete shared asset ${asset.name}`);
                                  return;
                                }
                                setArmedAction(null);
                                await deleteAdminPaymentAsset(asset.id);
                                setPaymentAssets((current) => current.filter((item) => item.id !== asset.id));
                                if (assetForm.id === asset.id) {
                                  resetAssetForm();
                                }
                                toast.success("Shared asset deleted.");
                              }}
                              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                armedAction === `delete-shared-asset-${asset.id}`
                                  ? "bg-rose-500 text-white"
                                  : "border border-rose-300 text-rose-600"
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

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
                        <h3 className="mt-3 text-lg font-semibold">
                          {(deposit.asset_amount ?? deposit.amount).toFixed(8).replace(/0+$/, "").replace(/\.$/, "")} {deposit.payment_asset?.symbol ?? deposit.crypto_asset.symbol} deposit
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                          {(deposit.payment_asset?.name ?? deposit.crypto_asset.name)} | {(deposit.payment_asset?.network ?? deposit.crypto_asset.network)}
                        </p>
                        <p className="mt-2 text-sm text-muted">
                          Wallet credit: ${Number(deposit.credited_amount_usd ?? deposit.amount).toFixed(2)} USD
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
                            const actionKey = `confirm-deposit-${deposit.id}`;
                            if (armedAction !== actionKey) {
                              armSensitiveAction(actionKey, `Confirm deposit #${deposit.id}`);
                              return;
                            }
                            setArmedAction(null);
                            const updated = await confirmAdminWalletDeposit(
                              deposit.id,
                              depositNotes[deposit.id] ?? "",
                            );
                            setDeposits((current) =>
                              current.map((item) => (item.id === updated.id ? updated : item)),
                            );
                            toast.success("Deposit confirmed.");
                          }}
                          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white ${
                            armedAction === `confirm-deposit-${deposit.id}`
                              ? "bg-amber-500"
                              : "bg-primary"
                          }`}
                        >
                          {armedAction === `confirm-deposit-${deposit.id}` ? "Confirm now" : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const actionKey = `reject-deposit-${deposit.id}`;
                            if (armedAction !== actionKey) {
                              armSensitiveAction(actionKey, `Reject deposit #${deposit.id}`);
                              return;
                            }
                            setArmedAction(null);
                            const updated = await rejectAdminWalletDeposit(
                              deposit.id,
                              depositNotes[deposit.id] ?? "",
                            );
                            setDeposits((current) =>
                              current.map((item) => (item.id === updated.id ? updated : item)),
                            );
                            toast.success("Deposit rejected.");
                          }}
                          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                            armedAction === `reject-deposit-${deposit.id}`
                              ? "border-rose-500 bg-rose-500 text-white"
                              : "border-rose-300 text-rose-600"
                          }`}
                        >
                          {armedAction === `reject-deposit-${deposit.id}` ? "Confirm reject" : "Reject"}
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
                  <span>
                    {label}
                    {(key === "username" || key === "email") ? (
                      <span className="text-rose-500"> *</span>
                    ) : null}
                  </span>
                  <input
                    value={userForm[key as keyof typeof userForm] as string}
                    onChange={(event) => setUserForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                    required={key === "username" || key === "email"}
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
                          <p className="text-sm text-muted">
                            {managedUser.first_name} {managedUser.last_name} | {managedUser.email}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${managedUser.is_staff ? "border-primary/30 bg-primary/15 text-foreground" : "border-amber-500/30 bg-amber-500/15 text-foreground"}`}>
                              {managedUser.is_staff ? "Admin" : "Standard"}
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${(managedUser.is_active ?? true) ? "border-emerald-500/30 bg-emerald-500/15 text-foreground" : "border-rose-500/30 bg-rose-500/15 text-foreground"}`}>
                              {(managedUser.is_active ?? true) ? "Active" : "Deactivated"}
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold text-foreground ${getLoginStatusStyles(managedUser.last_login ?? null)}`}>
                              Last login: {formatLastLogin(managedUser.last_login ?? null)}
                            </span>
                          </div>
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
                            const actionKey = `toggle-admin-${managedUser.id}`;
                            const nextIsStaff = !managedUser.is_staff;
                            if (armedAction !== actionKey) {
                              armSensitiveAction(
                                actionKey,
                                `${nextIsStaff ? "Grant" : "Remove"} admin for ${managedUser.username || managedUser.email}`,
                              );
                              return;
                            }
                            setArmedAction(null);
                            updateUserInState(managedUser.id, { is_staff: nextIsStaff });
                            const updated = await updateAdminUser(managedUser.id, {
                              is_staff: nextIsStaff,
                            });
                            updateUserInState(updated.id, updated);
                            toast.success(managedUser.is_staff ? "Admin role removed." : "Admin role granted.");
                          }}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                            managedUser.is_staff
                              ? "bg-primary text-white"
                              : armedAction === `toggle-admin-${managedUser.id}`
                                ? "bg-amber-500 text-white"
                                : "border border-amber-300/50 bg-amber-500/10 text-amber-700 dark:text-amber-200"
                          }`}
                          disabled={managedUser.id === user?.id}
                          title={managedUser.id === user?.id ? "You cannot change your own admin role." : undefined}
                        >
                          <Shield className="h-4 w-4" />
                          {armedAction === `toggle-admin-${managedUser.id}`
                            ? managedUser.is_staff
                              ? "Confirm remove admin"
                              : "Confirm make admin"
                            : managedUser.is_staff
                              ? "Admin"
                              : "Make admin"}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const actionKey = `toggle-active-${managedUser.id}`;
                            const nextIsActive = !(managedUser.is_active ?? true);
                            if (armedAction !== actionKey) {
                              armSensitiveAction(
                                actionKey,
                                `${nextIsActive ? "Activate" : "Deactivate"} ${managedUser.username || managedUser.email}`,
                              );
                              return;
                            }
                            setArmedAction(null);
                            updateUserInState(managedUser.id, { is_active: nextIsActive });
                            const updated = await updateAdminUser(managedUser.id, {
                              is_active: nextIsActive,
                            });
                            updateUserInState(updated.id, updated);
                            toast.success((managedUser.is_active ?? true) ? "User deactivated." : "User activated.");
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            (managedUser.is_active ?? true)
                              ? armedAction === `toggle-active-${managedUser.id}`
                                ? "border border-rose-500 bg-rose-500 text-white"
                                : "border border-emerald-500/30 bg-emerald-500/15 text-foreground"
                              : armedAction === `toggle-active-${managedUser.id}`
                                ? "border border-emerald-500 bg-emerald-500 text-white"
                                : "border border-rose-500/30 bg-rose-500/15 text-foreground"
                          }`}
                          disabled={managedUser.id === user?.id}
                          title={managedUser.id === user?.id ? "You cannot deactivate your own account." : undefined}
                        >
                          {armedAction === `toggle-active-${managedUser.id}`
                            ? (managedUser.is_active ?? true)
                              ? "Confirm deactivate"
                              : "Confirm activate"
                            : (managedUser.is_active ?? true)
                              ? "Deactivate"
                              : "Activate"}
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
