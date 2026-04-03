/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Copy,
  Gift,
  LoaderCircle,
  Mail,
  ShoppingBag,
  Star,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  CredentialsResponse,
  Order,
  PaymentAsset,
  PaymentSubmission,
  PaymentDetailsResponse,
  Product,
  WalletSummary,
} from "@/types";
import { useAuthStore } from "@/stores/use-auth-store";
import { getPaymentAssets } from "@/lib/services/payments";
import { AssetIcon } from "@/components/ui/crypto-icon";
import {
  createGuestOrder,
  createOrderWithQuantity,
  downloadCredentialsPdf,
  downloadGuestCredentialsPdf,
  getCredentials,
  getGuestCredentials,
  getGuestOrder,
  getGuestPaymentDetails,
  getOrder,
  getPaymentDetails,
  payOrderWithWallet,
  selectPaymentAsset,
  submitGuestPayment,
  submitPayment,
} from "@/lib/services/orders";
import { normalizeCredentialsCollection } from "@/lib/utils/credentials";
import { getWallet } from "@/lib/services/wallet";
import toast from "react-hot-toast";

function ProductFallbackIcon({ category }: { category: string }) {
  const normalized = category.toLowerCase();

  if (normalized.includes("facebook")) {
    return <UserRound className="h-10 w-10 text-white/90" />;
  }
  if (normalized.includes("instagram")) {
    return <Camera className="h-10 w-10 text-white/90" />;
  }
  if (normalized.includes("email")) {
    return <Mail className="h-10 w-10 text-white/90" />;
  }
  if (normalized.includes("gift")) {
    return <Gift className="h-10 w-10 text-white/90" />;
  }

  return <ShoppingBag className="h-10 w-10 text-white/90" />;
}

export function ProductCard({
  onTagClick,
  product,
  variant = "card",
}: {
  onTagClick?: (tag: string) => void;
  product: Product;
  variant?: "card" | "row";
}) {
  const { user, hasBootstrapped } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<PaymentAsset[]>([]);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CredentialsResponse | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = product.singleItem ? 1 : (product.stockCount ?? 1);
  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
  });
  const [proofForm, setProofForm] = useState({
    tx_hash: "",
    note: "",
    screenshot: null as File | null,
  });
  const latestSubmission: PaymentSubmission | null =
    order?.payment_submissions?.[order.payment_submissions.length - 1] ?? null;

  const openModal = async () => {
    setOpen(true);
    if (assetsLoaded) {
      if (user && !walletSummary) {
        setWalletLoading(true);
        setWalletError(null);
        try {
          const wallet = await getWallet();
          setWalletSummary(wallet);
        } catch {
          setWalletSummary(null);
          setWalletError("Wallet balance is unavailable right now. You can still continue with crypto payment.");
        } finally {
          setWalletLoading(false);
        }
      }
      return;
    }
    setLoadingAssets(true);
    setAssetError(null);
    try {
      const data = await getPaymentAssets();
      setAssets(data);
      setAssetsLoaded(true);
      setSelectedAssetId((current) => current ?? data[0]?.id ?? null);
    } catch {
      setAssetError("Unable to load payment assets. Please try again shortly.");
      toast.error("Unable to load payment assets.");
    } finally {
      setLoadingAssets(false);
    }

    if (user) {
      setWalletLoading(true);
      setWalletError(null);
      try {
        const wallet = await getWallet();
        setWalletSummary(wallet);
      } catch {
        setWalletSummary(null);
        setWalletError("Wallet balance is unavailable right now. You can still continue with crypto payment.");
      } finally {
      setWalletLoading(false);
      }
    }
  };

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );

  const closeModal = () => {
    setOpen(false);
    setOrder(null);
    setPaymentDetails(null);
    setMessage(null);
    setCredentials(null);
    setWalletError(null);
    setProofForm({ tx_hash: "", note: "", screenshot: null });
    setGuestForm({ name: "", email: "" });
    setQuantity(1);
    setSelectedAssetId((current) => current ?? assets[0]?.id ?? null);
  };

  const authReady = hasBootstrapped;
  const isGuest = authReady && !user;
  const guestEmailValid = !isGuest || /.+@.+\..+/.test(guestForm.email.trim());
  const guestNameValid = !isGuest || guestForm.name.trim().length > 1;
  const canSubmitOrder =
    authReady && Boolean(selectedAssetId) && (!isGuest || (guestEmailValid && guestNameValid));
  const walletBalance = walletSummary?.balance ?? 0;
  const totalAmount = product.price * quantity;
  const canPayWithWallet = Boolean(user && walletSummary && walletBalance >= totalAmount);
  const canSubmitProof = Boolean(proofForm.tx_hash.trim() && proofForm.screenshot);
  const guestAccessToken = order?.guest_access_token ?? null;
  const guestAccessUrl = order?.guest_access_url ?? null;
  const quantityHelpText = product.singleItem
    ? "This product is limited to one purchase per order."
    : maxQuantity <= 1
      ? "Only 1 item is currently available."
      : `${maxQuantity} items currently available for this product.`;

  const handleCreateOrder = async () => {
    if (!selectedAssetId) {
      setAssetError("Select a payment method to continue.");
      return;
    }
    setBusy(true);
    setAssetError(null);
    setMessage(null);
    try {
      if (user) {
        const created = await createOrderWithQuantity(product.id, quantity);
        const updated = await selectPaymentAsset(created.id, selectedAssetId);
        const details = await getPaymentDetails(created.id);
        setOrder(updated);
        setPaymentDetails(details);
        setMessage("Payment instructions ready. Send the exact amount and network.");
      } else {
        const created = await createGuestOrder({
          productId: product.id,
          guestName: guestForm.name.trim(),
          guestEmail: guestForm.email.trim(),
          paymentAssetId: selectedAssetId,
          quantity,
        });
        if (!created.guest_access_token) {
          throw new Error("Guest access token missing from order response.");
        }
        const details = await getGuestPaymentDetails(created.guest_access_token);
        setOrder(created);
        setPaymentDetails(details);
        setMessage("Payment instructions ready. Save your secure access link before you leave this page.");
      }
      toast.success("Payment instructions ready.");
    } catch (err) {
      console.error("Failed to create order", err);
      setAssetError("Unable to create the order. Please try again.");
      toast.error("Unable to create order.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!order) return;
    if (!user && !guestAccessToken) {
      setAssetError("Guest access link is missing for this order.");
      return;
    }
    setBusy(true);
    setAssetError(null);
    try {
      const response = user
        ? await submitPayment(order.id, {
            tx_hash: proofForm.tx_hash.trim(),
            note: proofForm.note,
            screenshot: proofForm.screenshot,
          })
        : await submitGuestPayment(guestAccessToken ?? "", {
            tx_hash: proofForm.tx_hash.trim(),
            note: proofForm.note,
            screenshot: proofForm.screenshot,
          });
      setOrder(response.order);
      setMessage(response.message);
      setProofForm((current) => ({ ...current, screenshot: null }));
      toast.success("Payment submitted for confirmation.");
    } catch (err) {
      console.error("Payment submit failed", err);
      setAssetError("Payment submission failed. Please try again.");
      toast.error("Payment submission failed.");
    } finally {
      setBusy(false);
    }
  };

  const handlePayWithWallet = async () => {
    if (!user) return;
    setBusy(true);
    setAssetError(null);
    setMessage(null);
    try {
      const created = await createOrderWithQuantity(product.id, quantity);
      const paidOrder = await payOrderWithWallet(created.id);
      setOrder(paidOrder);
      setPaymentDetails(null);
      setMessage("Paid with wallet balance. Credentials are now available.");
      toast.success("Wallet payment successful.");
      const data = await getCredentials(paidOrder.id);
      setCredentials(data);
      const wallet = await getWallet();
      setWalletSummary(wallet);
    } catch (err) {
      console.error("Failed to pay with wallet", err);
      setAssetError("Unable to pay with wallet balance.");
      toast.error("Wallet payment failed.");
    } finally {
      setBusy(false);
    }
  };

  const refreshOrderStatus = async () => {
    if (!order) return;
    if (!user && !guestAccessToken) {
      setAssetError("Guest access link is missing for this order.");
      return;
    }
    setBusy(true);
    setAssetError(null);
    try {
      const refreshed = user ? await getOrder(order.id) : await getGuestOrder(guestAccessToken ?? "");
      setOrder(refreshed);
      setMessage("Order status refreshed.");
      toast.success("Order status refreshed.");
    } catch (err) {
      console.error("Failed to refresh order status", err);
      setAssetError("Unable to refresh order status.");
      toast.error("Unable to refresh status.");
    } finally {
      setBusy(false);
    }
  };

  const loadCredentials = async () => {
    if (!order) return;
    if (!user && !guestAccessToken) {
      setAssetError("Guest access link is missing for this order.");
      return;
    }
    try {
      const data = user ? await getCredentials(order.id) : await getGuestCredentials(guestAccessToken ?? "");
      setCredentials(data);
    } catch (err) {
      console.error("Failed to load credentials", err);
    }
  };

  useEffect(() => {
    if (order?.status === "paid" && !credentials) {
      const loadPaidCredentials = async () => {
        try {
          const data = user ? await getCredentials(order.id) : await getGuestCredentials(guestAccessToken ?? "");
          setCredentials(data);
        } catch (err) {
          console.error("Failed to load credentials", err);
        }
      };

      void loadPaidCredentials();
    }
  }, [credentials, guestAccessToken, order, user]);

  const handleDownloadPdf = async () => {
    if (!order) return;
    if (!user && !guestAccessToken) {
      setAssetError("Guest access link is missing for this order.");
      return;
    }
    const blob = user
      ? await downloadCredentialsPdf(order.id)
      : await downloadGuestCredentialsPdf(guestAccessToken ?? "");
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `order-${order.reference}-credentials.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const address = paymentDetails?.asset.wallet_address ?? selectedAsset?.wallet_address;
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
    toast.success("Wallet address copied.");
  };

  const handleCopyGuestLink = async () => {
    if (!guestAccessUrl) return;
    await navigator.clipboard.writeText(guestAccessUrl);
    toast.success("Secure order link copied.");
  };

  const credentialItems = normalizeCredentialsCollection(credentials?.credentials);

  return (
    <>
      {variant === "row" ? (
        <tr className="border-t border-border align-top">
          <td className="px-4 py-4">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${product.gradient}`}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : product.subcategoryIcon || product.categoryIcon ? (
                  <img
                    src={product.subcategoryIcon ?? product.categoryIcon ?? ""}
                    alt={`${product.name} icon`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <ProductFallbackIcon category={product.category} />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{product.name}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted lg:max-w-md">
                  {product.description}
                </p>
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {product.category}
            </span>
          </td>
          <td className="px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {product.tags.slice(0, 3).map((tag) => (
                <button
                  key={`${product.id}-${tag}`}
                  type="button"
                  onClick={() => onTagClick?.(tag)}
                  className="rounded-full border border-border bg-bg/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-primary hover:text-primary"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </td>
          <td className="px-4 py-4 text-sm text-muted">
            <div className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-current text-amber-400" />
              <span className="font-semibold text-foreground">{product.rating}</span>
            </div>
          </td>
          <td className="px-4 py-4">
            <p className="font-semibold text-foreground">${product.price.toFixed(2)}</p>
            <p className="text-xs text-muted">{product.delivery}</p>
          </td>
          <td className="px-4 py-4 text-sm text-muted">{product.stockStatus}</td>
          <td className="px-4 py-4">
            <div className="flex flex-col gap-2 lg:flex-row">
              <button
                type="button"
                onClick={() => void openModal()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Buy
              </button>
              <Link
                href={`/products/${product.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-bg/70 px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
              >
                Details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </td>
        </tr>
      ) : (
        <article className="group rounded-[1.75rem] border border-border bg-card/90 p-4 shadow-[var(--shadow-soft)]">
          <div
            className={`relative flex h-52 items-center justify-center overflow-hidden rounded-[1.35rem] bg-gradient-to-br ${product.gradient} transition duration-300 group-hover:scale-[1.015]`}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : product.subcategoryIcon || product.categoryIcon ? (
              <img
                src={product.subcategoryIcon ?? product.categoryIcon ?? ""}
                alt={`${product.name} icon`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <ProductFallbackIcon category={product.category} />
            )}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/35 to-transparent" />
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {product.category}
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-muted">
              <Star className="h-4 w-4 fill-current text-amber-400" />
              {product.rating}
            </span>
          </div>
          <h3 className="mt-4 text-xl font-semibold">{product.name}</h3>
          <p className="mt-2 text-sm leading-7 text-muted">{product.description}</p>
          {product.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <button
                  key={`${product.id}-${tag}`}
                  type="button"
                  onClick={() => onTagClick?.(tag)}
                  className="rounded-full border border-border bg-bg/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-primary hover:text-primary"
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Starting at</p>
              <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void openModal()}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:-translate-y-0.5"
              >
                Buy
              </button>
              <Link
                href={`/products/${product.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-bg/70 px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              >
                Details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>
      )}

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm">
              <div className="flex min-h-full items-center justify-center">
                <div className="w-full max-w-3xl rounded-[2rem] border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-primary">
                  Crypto payment
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {product.name}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Choose a supported crypto asset to view the QR code and wallet address.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg"
                aria-label="Close payment modal"
              >
                X
              </button>
            </div>

            {loadingAssets ? (
              <div className="mt-6 rounded-2xl border border-border bg-bg/60 p-4 text-sm text-muted">
                Loading payment assets...
              </div>
            ) : assetError ? (
              <div className="mt-6 rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger-foreground)]">
                {assetError}
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {!paymentDetails ? (
                  order?.status === "paid" ? (
                    <div className="rounded-[1.75rem] border border-border bg-card/80 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                            Wallet payment confirmed
                          </p>
                          <h3 className="mt-2 text-xl font-semibold">Credentials are ready</h3>
                          <p className="mt-2 text-sm text-muted">
                            Your wallet balance covered the purchase. Download the PDF or copy credentials below.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-4 py-2 text-sm font-semibold"
                        >
                          Download PDF
                        </button>
                      </div>
                      {credentialItems.length > 0 ? (
                        <div className="mt-5 space-y-2 rounded-2xl border border-border bg-bg/60 p-4 text-sm">
                          {credentialItems.map((item, index) => (
                            <div key={`${order?.reference ?? product.id}-${index}`} className="rounded-2xl border border-border bg-card/70 p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                                Account {index + 1}
                              </p>
                              <div className="mt-3 space-y-2">
                                {Object.entries(item).map(([key, value]) => (
                                  <div key={key} className="flex flex-wrap items-start justify-between gap-4">
                                    <span className="font-semibold">{key}</span>
                                    <span className="break-all font-mono text-muted">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={loadCredentials}
                          className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-semibold"
                        >
                          Reveal credentials
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-3xl border border-border bg-bg/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                        Buyer details
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">Checkout form</h3>
                      <p className="mt-2 text-sm text-muted">
                        Guest orders use email for delivery updates. Your details are visible only to staff.
                      </p>
                      {!authReady ? (
                        <div className="mt-4 rounded-2xl border border-border bg-card/70 p-4 text-sm text-muted">
                          Checking account session...
                        </div>
                      ) : isGuest ? (
                        <div className="mt-4 grid gap-4">
                          <label className="text-sm font-medium">
                            Name
                            <input
                              value={guestForm.name}
                              onChange={(event) =>
                                setGuestForm((current) => ({ ...current, name: event.target.value }))
                              }
                              className="mt-2 w-full rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm outline-none focus:border-primary"
                              placeholder="Jane Doe"
                            />
                          </label>
                          <label className="text-sm font-medium">
                            Email
                            <input
                              value={guestForm.email}
                              onChange={(event) =>
                                setGuestForm((current) => ({ ...current, email: event.target.value }))
                              }
                              className="mt-2 w-full rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm outline-none focus:border-primary"
                              placeholder="jane@email.com"
                              type="email"
                            />
                            {!guestEmailValid ? (
                              <p className="mt-1 text-xs text-[var(--color-danger-foreground)]">
                                Enter a valid email address.
                              </p>
                            ) : null}
                          </label>
                          <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm">
                            <span className="font-semibold">Quantity</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                                className="h-8 w-8 rounded-full border border-border text-sm font-semibold"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-semibold">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                                className="h-8 w-8 rounded-full border border-border text-sm font-semibold disabled:opacity-50"
                                disabled={quantity >= maxQuantity}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted">
                            Total: ${totalAmount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted">
                            {quantityHelpText}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card/70 p-4 text-sm text-muted">
                          <p>
                            Signed in as <span className="font-semibold text-foreground">{user?.username}</span>.
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Quantity</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                                className="h-8 w-8 rounded-full border border-border text-sm font-semibold"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-semibold">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                                className="h-8 w-8 rounded-full border border-border text-sm font-semibold disabled:opacity-50"
                                disabled={quantity >= maxQuantity}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted">
                            {quantityHelpText}
                          </p>
                        </div>
                      )}
                      <div className="mt-5 rounded-2xl border border-dashed border-border bg-card/50 p-4 text-xs text-muted">
                        You will receive an order number for support and, for guest checkout, a secure private link for future access.
                      </div>
                    </div>

                    <div className="space-y-4">
                      {user ? (
                        <div className="rounded-3xl border border-border bg-bg/60 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                            Wallet balance
                          </p>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="text-muted">Available</span>
                            <span className="text-lg font-semibold">${walletBalance.toFixed(2)}</span>
                          </div>
                          {walletLoading ? (
                            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Loading wallet...
                            </div>
                          ) : null}
                          {walletError ? (
                            <div className="mt-3 rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] p-3 text-xs text-[var(--color-warning-foreground)]">
                              {walletError}
                            </div>
                          ) : null}
                          <button
                            type="button"
                            onClick={handlePayWithWallet}
                            disabled={busy || !canPayWithWallet}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-4 py-3 text-sm font-semibold disabled:opacity-60"
                          >
                            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                            Pay with wallet balance
                          </button>
                          {!canPayWithWallet ? (
                            <p className="mt-2 text-xs text-muted">
                              Add funds to your wallet to pay instantly.
                            </p>
                          ) : (
                            <p className="mt-2 text-xs text-muted">
                              Wallet payments confirm instantly and unlock credentials right away.
                            </p>
                          )}
                        </div>
                      ) : null}

                      <div className="rounded-3xl border border-border bg-bg/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                        Payment methods
                      </p>
                      <div className="mt-4 grid gap-3">
                          {assets.map((asset) => {
                            const active = asset.id === selectedAssetId;
                            return (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() => setSelectedAssetId(asset.id)}
                                className={`rounded-3xl border p-4 text-left transition ${active ? "border-primary bg-accent/80 shadow-lg" : "border-border bg-bg/65 hover:border-primary/40"}`}
                              >
                                <div className="flex items-center gap-3">
                                  {asset.qr_code_image ? (
                                    <img
                                      src={asset.qr_code_image}
                                      alt={`${asset.name} QR`}
                                      className="h-10 w-10 rounded-2xl border border-border object-cover"
                                    />
                                  ) : (
                                    <AssetIcon symbol={asset.symbol} network={asset.network} size={40} />
                                  )}
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                                      {asset.symbol}
                                    </p>
                                    <h3 className="mt-2 text-lg font-semibold">{asset.name}</h3>
                                    <p className="mt-1 text-sm text-muted">{asset.network}</p>
                                  </div>
                                </div>
                                <p className="mt-2 text-xs leading-6 text-muted">
                                  {asset.instructions || "Admin-configured manual settlement instructions."}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      <button
                        type="button"
                        onClick={handleCreateOrder}
                        disabled={busy || !canSubmitOrder}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                        Buy {quantity} now (${totalAmount.toFixed(2)})
                      </button>
                        {isGuest ? (
                          <p className="mt-3 text-xs text-muted">
                            Guests will use the email above to receive updates after confirmation.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  )
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[1.75rem] border border-border bg-card/70 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                        QR code
                      </p>
                      {paymentDetails.asset.qr_code_image ? (
                        <img
                          src={paymentDetails.asset.qr_code_image}
                          alt={`${paymentDetails.asset.name} QR code`}
                          className="mt-4 h-56 w-56 rounded-3xl border border-border object-cover"
                        />
                      ) : (
                        <div className="mt-4 flex h-56 w-56 items-center justify-center rounded-3xl border border-dashed border-border text-sm text-muted">
                          QR code not uploaded yet
                        </div>
                      )}
                      <p className="mt-4 text-xs text-muted">
                        Order reference: <span className="font-mono">{paymentDetails.reference}</span>
                      </p>
                    </div>

                    <div className="rounded-[1.75rem] border border-border bg-bg/60 p-5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                          Payment details
                        </p>
                        {order ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            {order.status.replaceAll("_", " ")}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 space-y-4 text-sm">
                        <div>
                          <p className="text-xs text-muted">Amount</p>
                          <p className="mt-1 text-lg font-semibold">${totalAmount.toFixed(2)}</p>
                          <p className="text-xs text-muted">Quantity: {quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Send to</p>
                          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card/70 px-4 py-3 text-xs font-mono">
                            <span className="break-all">{paymentDetails.asset.wallet_address}</span>
                            <button
                              type="button"
                              onClick={handleCopy}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted"
                              aria-label="Copy wallet address"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          {copied ? <p className="mt-2 text-xs text-emerald-500">Copied to clipboard.</p> : null}
                        </div>
                      </div>
                      <div className="mt-5 rounded-2xl border border-dashed border-border bg-card/50 p-4 text-xs text-muted">
                        Send only on the listed network. Submit both your transaction hash / ID and a payment screenshot for admin review.
                      </div>
                      {!user && guestAccessUrl ? (
                        <div className="mt-5 rounded-2xl border border-[var(--color-success-border)] bg-[var(--color-success-soft)] p-4 text-xs text-[var(--color-success-foreground)]">
                          <p className="font-semibold">Save this secure guest access link.</p>
                          <p className="mt-2 break-all font-mono">{guestAccessUrl}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={handleCopyGuestLink}
                              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-success-border)] bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--color-success-foreground)]"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy link
                            </button>
                            <Link
                              href={`/guest/orders/${guestAccessToken}`}
                              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-success-border)] bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--color-success-foreground)]"
                            >
                              View order
                            </Link>
                          </div>
                          <p className="mt-3">Do not share this link. It is the secure way to return to your purchase later.</p>
                        </div>
                      ) : null}
                      <div className="mt-5 space-y-3">
                        <label className="text-sm font-medium">
                          Transaction hash / ID
                          <input
                            value={proofForm.tx_hash}
                            onChange={(event) =>
                              setProofForm((current) => ({ ...current, tx_hash: event.target.value }))
                            }
                            className="mt-2 w-full rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm outline-none focus:border-primary"
                            placeholder="Paste transaction hash or transfer ID"
                          />
                        </label>
                        <label className="text-sm font-medium">
                          Payment screenshot
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              setProofForm((current) => ({
                                ...current,
                                screenshot: event.target.files?.[0] ?? null,
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm outline-none focus:border-primary"
                          />
                          <p className="mt-1 text-xs text-muted">
                            Upload the screenshot you want the admin to review.
                          </p>
                          {proofForm.screenshot ? (
                            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">
                              Selected file: {proofForm.screenshot.name}
                            </p>
                          ) : null}
                        </label>
                        <label className="text-sm font-medium">
                          Note (optional)
                          <textarea
                            value={proofForm.note}
                            onChange={(event) =>
                              setProofForm((current) => ({ ...current, note: event.target.value }))
                            }
                            rows={3}
                            className="mt-2 w-full rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm outline-none focus:border-primary"
                            placeholder="Any extra notes for review"
                          />
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleSubmitPayment}
                            disabled={busy || !canSubmitProof}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                            I have made payment
                          </button>
                          <button
                            type="button"
                            onClick={refreshOrderStatus}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-3 text-sm font-semibold"
                          >
                            Refresh status
                          </button>
                        </div>
                        {!canSubmitProof ? (
                          <p className="text-xs text-muted">
                            Add both the transaction hash / ID and the payment screenshot before submitting.
                          </p>
                        ) : null}
                      </div>
                      {latestSubmission ? (
                        <div className="mt-5 rounded-2xl border border-border bg-card/70 p-4 text-xs text-muted">
                          <p className="font-semibold text-foreground">Latest proof submission</p>
                          <p className="mt-2 break-all">
                            Tx hash / ID: <span className="font-mono">{latestSubmission.tx_hash || "Not provided"}</span>
                          </p>
                          <p className="mt-1">
                            Review status: <span className="font-semibold">{latestSubmission.review_status.replaceAll("_", " ")}</span>
                          </p>
                          {latestSubmission.screenshot ? (
                            <a
                              href={latestSubmission.screenshot}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex text-primary underline-offset-4 hover:underline"
                            >
                              View uploaded screenshot
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                      {message ? (
                        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--color-success-border)] bg-[var(--color-success-soft)] p-3 text-xs text-[var(--color-success-foreground)]">
                          <CheckCircle2 className="h-4 w-4" />
                          {message}
                        </div>
                      ) : null}
                      {order?.status === "paid" ? (
                        <div className="mt-5 rounded-2xl border border-border bg-card/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">Credentials unlocked</p>
                            <button
                              type="button"
                              onClick={handleDownloadPdf}
                              className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-2 text-xs font-semibold"
                            >
                              Download PDF
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={loadCredentials}
                            className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-2 text-xs font-semibold"
                          >
                            Reveal credentials
                          </button>
                          {credentialItems.length > 0 ? (
                            <div className="mt-3 space-y-2 text-xs text-muted">
                              {credentialItems.map((item, index) => (
                                <div key={`${order?.reference ?? product.id}-locked-${index}`} className="rounded-2xl border border-border bg-bg/70 p-3">
                                  <p className="font-semibold text-foreground">Account {index + 1}</p>
                                  <div className="mt-2 space-y-2">
                                    {Object.entries(item).map(([key, value]) => (
                                      <div key={key} className="flex items-start justify-between gap-4">
                                        <span className="font-semibold text-foreground">{key}</span>
                                        <span className="break-all font-mono">{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
                </div>
              )}
              </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
