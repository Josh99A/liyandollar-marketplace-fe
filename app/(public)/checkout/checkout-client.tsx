"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { CheckoutSummary } from "@/components/marketplace/checkout-summary";
import { SectionHeading } from "@/components/ui/section-heading";
import { useAuthStore } from "@/stores/use-auth-store";
import { createOrder, getPaymentDetails, selectPaymentAsset, submitPayment } from "@/lib/services/orders";
import { getPaymentAssets } from "@/lib/services/payments";
import { getProductBySlugClient } from "@/lib/services/products";
import type { Order, PaymentAsset, PaymentDetailsResponse, Product } from "@/types";

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    awaiting_confirmation: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    paid: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    cancelled: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
    failed: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
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
  const { user, hasBootstrapped } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [assets, setAssets] = useState<PaymentAsset[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
      } catch (err) {
        console.error("Failed to load checkout context", err);
        setError("Unable to load checkout information right now.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [slug]);

  const selectedAssetId = order?.selected_payment_asset?.id ?? null;
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
      const created = await createOrder(product.id);
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
                Sign in to create an order, select a payment asset, and track confirmation.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/login?redirect=/checkout?product=${product.slug}`}
                  className="rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Login to continue
                </Link>
                <Link
                  href="/register"
                  className="rounded-full border border-border px-5 py-3 text-center text-sm font-semibold"
                >
                  Create account
                </Link>
              </div>
            </div>
          ) : !order ? (
            <div className="mt-6 rounded-[1.5rem] border border-border bg-bg/55 p-5">
              <p className="text-sm leading-7 text-muted">
                Create a pending order first. After that you can pick a crypto asset and receive wallet instructions plus the order reference.
              </p>
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
              <div className="mt-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                  Step 1
                </p>
                <h3 className="mt-2 text-xl font-semibold">Choose payment asset</h3>
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
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                          {asset.symbol}
                        </p>
                        <h4 className="mt-2 text-lg font-semibold">{asset.name}</h4>
                        <p className="mt-1 text-sm text-muted">{asset.network}</p>
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
                      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
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
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4" />
              <p>{message}</p>
            </div>
          ) : null}
          {error ? (
            <div className="mt-6 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          ) : null}
        </section>
        <CheckoutSummary product={product} />
      </div>
    </div>
  );
}
