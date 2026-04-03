"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { CheckoutSummary } from "@/components/marketplace/checkout-summary";
import { SectionHeading } from "@/components/ui/section-heading";
import { useAuthStore } from "@/stores/use-auth-store";
import { createGuestOrder, createOrderWithQuantity, getPaymentDetails, payOrderWithWallet, selectPaymentAsset, submitPayment } from "@/lib/services/orders";
import { getPaymentAssets } from "@/lib/services/payments";
import { getProductBySlugClient } from "@/lib/services/products";
import { getWallet } from "@/lib/services/wallet";
import { AssetIcon } from "@/components/ui/crypto-icon";
import type { Order, PaymentAsset, PaymentDetailsResponse, Product } from "@/types";

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] text-[var(--color-warning-foreground)]",
    awaiting_confirmation: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    paid: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    cancelled: "border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] text-[var(--color-danger-foreground)]",
    failed: "border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] text-[var(--color-danger-foreground)]",
  } as const;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${styles[status as keyof typeof styles] ?? "bg-slate-500/12 text-slate-700 dark:text-slate-100"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function CheckoutClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { user, hasBootstrapped } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [assets, setAssets] = useState<PaymentAsset[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = product?.singleItem ? 1 : (product?.stockCount ?? 1);
  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
  });
  const [guestPaymentAssetId, setGuestPaymentAssetId] = useState<string>("");
  const [form, setForm] = useState({
    tx_hash: "",
    sender_wallet_address: "",
    note: "",
    screenshot: null as File | null,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [resolvedProduct, paymentAssets] = await Promise.all([
          getProductBySlugClient(slug),
          getPaymentAssets(),
        ]);
        setProduct(resolvedProduct);
        setAssets(paymentAssets);
        setGuestPaymentAssetId((current) => current || paymentAssets[0]?.id || "");
      } catch (err) {
        console.error("Failed to load checkout context", err);
        setError("Unable to load checkout information right now.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [slug]);

  useEffect(() => {
    if (!hasBootstrapped || !user) return;
    const loadWallet = async () => {
      setWalletLoading(true);
      try {
        const wallet = await getWallet();
        setWalletBalance(wallet.balance);
      } catch (err) {
        console.error("Failed to load wallet balance", err);
      } finally {
        setWalletLoading(false);
      }
    };
    void loadWallet();
  }, [hasBootstrapped, user]);

  const selectedAssetId = order?.selected_payment_asset?.id ?? null;
  const isGuest = hasBootstrapped && !user;
  const guestEmailValid = !isGuest || /.+@.+\..+/.test(guestForm.email.trim());
  const guestNameValid = !isGuest || guestForm.name.trim().length > 1;
  const quantityHelpText = product?.singleItem
    ? "This product is limited to one purchase per order."
    : maxQuantity <= 1
      ? "Only 1 item is currently available."
      : `${maxQuantity} items currently available for this product.`;
  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );

  const handleCreateOrder = async () => {
    if (!product) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (!user) {
        const created = await createGuestOrder({
          productId: product.id,
          guestName: guestForm.name.trim(),
          guestEmail: guestForm.email.trim(),
          paymentAssetId: guestPaymentAssetId || null,
          quantity,
        });
        router.push(
          `/checkout/success?order=${encodeURIComponent(created.reference)}&access=${encodeURIComponent(created.guest_access_url ?? "")}&guest=1`,
        );
        return;
      }
      const created = await createOrderWithQuantity(product.id, quantity);
      setOrder(created);
      setMessage("Order created. Select a payment asset to reveal wallet instructions.");
      toast.success("Order created. Select a payment asset.");
    } catch (err) {
      console.error("Failed to create order", err);
      setError("We could not create the order. Make sure you are signed in and try again.");
      toast.error("Unable to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayWithWallet = async () => {
    if (!product) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const created = order ?? (await createOrderWithQuantity(product.id, quantity));
      const paid = await payOrderWithWallet(created.id);
      setOrder(paid);
      setPaymentDetails(null);
      setMessage("Paid with wallet balance. Credentials are now available in your orders.");
      const wallet = await getWallet();
      setWalletBalance(wallet.balance);
      toast.success("Wallet payment successful.");
    } catch (err) {
      console.error("Failed wallet payment", err);
      setError("Unable to pay with wallet balance.");
      toast.error("Wallet payment failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAsset = async (assetId: string) => {
    if (!order) return;
    setSubmitting(true);
    setError(null);
    try {
      const updatedOrder = await selectPaymentAsset(order.id, assetId);
      const details = await getPaymentDetails(order.id);
      setOrder(updatedOrder);
      setPaymentDetails(details);
      setMessage("Payment instructions loaded. Send the exact amount using the correct network.");
      toast.success("Payment instructions loaded.");
    } catch (err) {
      console.error("Failed to load payment details", err);
      setError("Unable to load payment instructions for that asset.");
      toast.error("Unable to load payment instructions.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!order) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitPayment(order.id, form);
      setOrder(response.order);
      setMessage(response.message);
      toast.success("Payment submitted for admin review.");
    } catch (err) {
      console.error("Failed to submit payment proof", err);
      setError("Payment proof submission failed. Please try again.");
      toast.error("Payment proof submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!paymentDetails) return;
    await navigator.clipboard.writeText(paymentDetails.asset.wallet_address);
    setMessage("Wallet address copied.");
    toast.success("Wallet address copied.");
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-20">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-lg font-semibold">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <SectionHeading
        eyebrow="Checkout"
        title="Create an order, choose a crypto asset, and wait for admin confirmation"
        description="Orders stay pending until a payment asset is selected and your payment proof is submitted. Credentials unlock only after an admin marks the order as paid."
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-[2rem] border border-border bg-card/80 p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Crypto checkout flow</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Supported payment methods are admin-managed and can be extended later without changing the order architecture.
              </p>
            </div>
            {order ? <StatusBadge status={order.status} /> : null}
          </div>

          {!hasBootstrapped ? null : !user ? (
            <div className="mt-6 rounded-[1.5rem] border border-border bg-bg/55 p-5">
              <p className="text-sm leading-7 text-muted">
                Guest checkout is available here. If you prefer, you can still sign in to keep purchases in your dashboard permanently.
              </p>
              <div className="mt-4 grid gap-4">
                <label className="space-y-2 text-sm font-medium">
                  <span>Name</span>
                  <input
                    value={guestForm.name}
                    onChange={(event) =>
                      setGuestForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
                    placeholder="Jane Doe"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Email</span>
                  <input
                    value={guestForm.email}
                    onChange={(event) =>
                      setGuestForm((current) => ({ ...current, email: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
                    placeholder="jane@email.com"
                    type="email"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Payment asset</span>
                  <select
                    value={guestPaymentAssetId}
                    onChange={(event) => setGuestPaymentAssetId(event.target.value)}
                    className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                  >
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.symbol}) - {asset.network}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm">
                  <span className="text-muted">Quantity</span>
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
                <p className="text-xs text-muted">{quantityHelpText}</p>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={submitting || !guestEmailValid || !guestNameValid || !guestPaymentAssetId}
                  className="rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-white disabled:opacity-70"
                >
                  {submitting ? "Creating guest order..." : "Continue as guest"}
                </button>
                <Link
                  href={`/login?redirect=/checkout?product=${product.slug}`}
                  className="rounded-full border border-border px-5 py-3 text-center text-sm font-semibold"
                >
                  Login instead
                </Link>
                <Link
                  href="/register"
                  className="rounded-full border border-border px-5 py-3 text-center text-sm font-semibold"
                >
                  Create account
                </Link>
              </div>
              {!guestEmailValid || !guestNameValid ? (
                <p className="mt-3 text-xs text-muted">
                  Enter your name and a valid email address so we can send your secure order link and updates.
                </p>
              ) : !guestPaymentAssetId ? (
                <p className="mt-3 text-xs text-muted">
                  No payment asset is available for guest checkout right now.
                </p>
              ) : null}
            </div>
          ) : !order ? (
            <div className="mt-6 rounded-[1.5rem] border border-border bg-bg/55 p-5">
              <p className="text-sm leading-7 text-muted">
                Create a pending order first. After that you can pick a crypto asset and receive wallet instructions plus the order reference.
              </p>
              {user ? (
                <div className="mt-4 rounded-2xl border border-border bg-card/70 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Wallet balance</span>
                    <span className="text-base font-semibold">
                      {walletBalance === null ? "--" : `$${walletBalance.toFixed(2)}`}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Pay instantly with your wallet balance or continue with crypto checkout.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted">Quantity</span>
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
                  <p className="mt-2 text-xs text-muted">{quantityHelpText}</p>
                  <button
                    type="button"
                    onClick={handlePayWithWallet}
                    disabled={submitting || walletBalance === null || walletBalance < ((product?.price ?? 0) * quantity)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-bg px-4 py-3 text-sm font-semibold disabled:opacity-60"
                  >
                    {walletLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                    Pay with wallet balance
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={submitting}
                className="mt-4 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {submitting ? "Creating order..." : "Create pending order"}
              </button>
            </div>
          ) : (
            <>
              {user && walletBalance !== null ? (
                <div className="mt-6 rounded-[1.5rem] border border-border bg-card/70 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                        Wallet payment
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        Available balance: ${walletBalance.toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePayWithWallet}
                      disabled={submitting || walletBalance < (product.price * quantity)}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    >
                      {walletLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                      Pay with wallet
                    </button>
                  </div>
                  {walletBalance < (product.price * quantity) ? (
                    <p className="mt-2 text-xs text-muted">
                      Add funds to your wallet to cover the ${(product.price * quantity).toFixed(2)} purchase.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted">
                      Wallet payments confirm instantly and unlock credentials right away.
                    </p>
                  )}
                </div>
              ) : null}
              <div className="mt-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                  Step 1
                </p>
                <h3 className="mt-2 text-xl font-semibold">Choose payment asset</h3>
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm">
                  <span className="text-muted">Quantity</span>
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
                <p className="mt-2 text-xs text-muted">{quantityHelpText}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {assets.map((asset) => {
                    const active = selectedAsset?.id === asset.id;
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => handleSelectAsset(asset.id)}
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
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                              {asset.symbol}
                            </p>
                            <h4 className="mt-2 text-lg font-semibold">{asset.name}</h4>
                            <p className="mt-1 text-sm text-muted">{asset.network}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs leading-6 text-muted">
                          {asset.instructions || "Admin-configured manual settlement instructions."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentDetails ? (
                <div className="mt-8 space-y-6">
                  <div className="rounded-[1.5rem] border border-border bg-[linear-gradient(135deg,rgba(7,43,75,0.98),rgba(11,95,216,0.94),rgba(76,203,112,0.72))] p-5 text-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-white/70">
                          Order reference
                        </p>
                        <p className="mt-2 font-mono text-sm">{paymentDetails.reference}</p>
                        <p className="mt-4 text-xs uppercase tracking-[0.28em] text-white/70">
                          Wallet address
                        </p>
                        <p className="mt-2 break-all font-mono text-sm leading-7">
                          {paymentDetails.asset.wallet_address}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
                      >
                        <Copy className="h-4 w-4" />
                        Copy address
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-3xl border border-border bg-bg/60 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                        Payment method
                      </p>
                      <p className="mt-3 text-lg font-semibold">
                        {paymentDetails.asset.name} ({paymentDetails.asset.symbol})
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Network: {paymentDetails.asset.network}
                      </p>
                      {paymentDetails.asset.qr_code_image ? (
                        <Image
                          src={paymentDetails.asset.qr_code_image}
                          alt={`${paymentDetails.asset.name} QR code`}
                          width={176}
                          height={176}
                          className="mt-4 h-44 w-44 rounded-3xl border border-border object-cover"
                        />
                      ) : (
                        <div className="mt-4 flex h-44 w-44 items-center justify-center rounded-3xl border border-dashed border-border text-sm text-muted">
                          QR code not uploaded yet
                        </div>
                      )}
                    </div>
                    <div className="rounded-3xl border border-border bg-bg/60 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                        Instructions
                      </p>
                      <p className="mt-3 text-sm leading-7 text-muted">
                        {paymentDetails.asset.instructions ||
                          "Send the exact amount using the selected network, then submit your transaction details below for admin review."}
                      </p>
                      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] p-4 text-sm text-[var(--color-warning-foreground)]">
                        <AlertTriangle className="mt-0.5 h-4 w-4" />
                        <p>Do not send funds on the wrong network. Manual admin confirmation is required before the order becomes paid.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium">
                      <span>Transaction hash</span>
                      <input
                        value={form.tx_hash}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, tx_hash: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
                        placeholder="Paste blockchain transaction hash"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      <span>Sender wallet</span>
                      <input
                        value={form.sender_wallet_address}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            sender_wallet_address: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
                        placeholder="Optional sending wallet address"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium sm:col-span-2">
                      <span>Proof note</span>
                      <textarea
                        rows={4}
                        value={form.note}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, note: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
                        placeholder="Optional note for the admin reviewer"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium sm:col-span-2">
                      <span>Upload proof screenshot</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            screenshot: event.target.files?.[0] ?? null,
                          }))
                        }
                        className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitPayment}
                    disabled={submitting}
                    className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                  >
                    {submitting ? "Submitting..." : "I have made payment"}
                  </button>
                </div>
              ) : null}
            </>
          )}

          {message ? (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--color-success-border)] bg-[var(--color-success-soft)] p-4 text-sm text-[var(--color-success-foreground)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4" />
              <p>{message}</p>
            </div>
          ) : null}
          {error ? (
            <div className="mt-6 rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger-foreground)]">
              {error}
            </div>
          ) : null}
        </section>
        <CheckoutSummary product={product} quantity={quantity} />
      </div>
    </div>
  );
}
