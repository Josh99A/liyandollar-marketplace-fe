"use client";

import Image from "next/image";
import Link from "next/link";
import { Copy, Download, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  downloadGuestCredentialsPdf,
  getGuestCredentials,
  getGuestOrder,
  getGuestPaymentDetails,
  submitGuestPayment,
} from "@/lib/services/orders";
import { normalizeCredentialsCollection } from "@/lib/utils/credentials";
import type { CredentialsResponse, Order, PaymentDetailsResponse } from "@/types";

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] text-[var(--color-warning-foreground)]",
    awaiting_confirmation: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    paid: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    cancelled: "border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] text-[var(--color-danger-foreground)]",
    failed: "border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] text-[var(--color-danger-foreground)]",
  } as const;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${styles[status as keyof typeof styles] ?? "bg-slate-500/12 text-slate-700 dark:text-slate-100"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function GuestOrderDetailClient({ token }: { token: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsResponse | null>(null);
  const [credentials, setCredentials] = useState<CredentialsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [note, setNote] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const latestSubmission = order?.payment_submissions?.[order.payment_submissions.length - 1] ?? null;
  const credentialItems = normalizeCredentialsCollection(credentials?.credentials);

  useEffect(() => {
    const load = async () => {
      try {
        const currentOrder = await getGuestOrder(token);
        setOrder(currentOrder);
        if (currentOrder.selected_payment_asset) {
          const details = await getGuestPaymentDetails(token);
          setPaymentDetails(details);
        }
      } catch {
        setError("Unable to load this guest order. The link may be invalid or expired.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const refreshOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const currentOrder = await getGuestOrder(token);
      setOrder(currentOrder);
      if (currentOrder.selected_payment_asset) {
        const details = await getGuestPaymentDetails(token);
        setPaymentDetails(details);
      }
      setMessage("Order status refreshed.");
    } catch {
      setError("Unable to refresh this order right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPayment = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitGuestPayment(token, {
        tx_hash: txHash.trim(),
        note,
        screenshot,
      });
      setOrder(response.order);
      setMessage(response.message);
      setScreenshot(null);
    } catch {
      setError("Unable to submit payment proof.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadCredentials = async () => {
    try {
      const response = await getGuestCredentials(token);
      setCredentials(response);
    } catch {
      setError("Credentials are not available yet.");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await downloadGuestCredentialsPdf(token);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `guest-order-${order?.reference ?? "credentials"}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Unable to download the PDF.");
    }
  };

  const handleCopyAddress = async () => {
    if (!paymentDetails?.asset.wallet_address) return;
    await navigator.clipboard.writeText(paymentDetails.asset.wallet_address);
    setCopiedAddress(true);
    window.setTimeout(() => setCopiedAddress(false), 1800);
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-10 sm:px-6 lg:px-8">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm text-muted">Loading guest order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-border bg-card/90 p-6">
          Guest order not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Guest Order"
        title={order.product.name}
        description="Track payment status, review instructions, and unlock credentials only after payment is confirmed."
      />

      <section className="rounded-[1.75rem] border border-border bg-card/90 p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <StatusBadge status={order.status} />
            <p className="mt-3 text-sm text-muted">Order number: {order.reference}</p>
            <p className="mt-1 text-sm text-muted">Quantity: {order.quantity ?? 1}</p>
            <p className="mt-1 text-sm text-muted">Guest email: {order.guest_email}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm">
              Expected <span className="font-semibold">${Number(order.amount_expected).toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={refreshOrder}
              disabled={submitting}
              className="rounded-full border border-border px-4 py-3 text-sm font-semibold"
            >
              Refresh status
            </button>
          </div>
        </div>

        {paymentDetails ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-border bg-bg/60 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Selected asset
              </p>
              <h3 className="mt-3 text-xl font-semibold">
                {paymentDetails.asset.name} ({paymentDetails.asset.symbol})
              </h3>
              <p className="mt-1 text-sm text-muted">
                Network: {paymentDetails.asset.network}
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 font-mono text-sm">
                <span className="break-all">{paymentDetails.asset.wallet_address}</span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-muted"
                  aria-label="Copy wallet address"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copiedAddress ? (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">Address copied.</p>
              ) : null}
              {paymentDetails.asset.qr_code_image ? (
                <Image
                  src={paymentDetails.asset.qr_code_image}
                  alt="Payment QR code"
                  width={176}
                  height={176}
                  className="mt-4 h-44 w-44 rounded-3xl border border-border object-cover"
                />
              ) : null}
            </div>
            <div className="rounded-3xl border border-border bg-bg/60 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Instructions
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                {paymentDetails.asset.instructions || "Send payment, then submit your transaction hash / ID and screenshot for manual review."}
              </p>
              {order.status !== "paid" ? (
                <div className="mt-5 grid gap-4">
                  <input
                    value={txHash}
                    onChange={(event) => setTxHash(event.target.value)}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-primary"
                    placeholder="Transaction hash or transfer ID"
                  />
                  <label className="grid gap-2 text-sm font-medium">
                    <span>Payment screenshot</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)}
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                    />
                  </label>
                  <textarea
                    rows={4}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-primary"
                    placeholder="Optional note"
                  />
                  <button
                    type="button"
                    onClick={handleSubmitPayment}
                    disabled={submitting || !txHash.trim() || !screenshot}
                    className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                  >
                    {submitting ? "Submitting..." : "Submit payment proof"}
                  </button>
                  {order.status === "awaiting_confirmation" ? (
                    <p className="text-xs text-muted">Awaiting payment confirmation from an admin reviewer.</p>
                  ) : null}
                </div>
              ) : null}
              {latestSubmission ? (
                <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-sm text-muted">
                  <p className="font-semibold text-foreground">Latest proof submission</p>
                  <p className="mt-2 break-all">
                    Tx hash / ID: <span className="font-mono">{latestSubmission.tx_hash || "Not provided"}</span>
                  </p>
                  <p className="mt-1">
                    Review status: <span className="font-semibold">{latestSubmission.review_status.replaceAll("_", " ")}</span>
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-border bg-bg/60 p-5 text-sm text-muted">
            Payment instructions are not available for this order yet.
          </div>
        )}

        {order.status === "paid" ? (
          <div className="mt-6 rounded-3xl border border-[var(--color-success-border)] bg-[var(--color-success-soft)] p-5">
            <p className="text-sm font-semibold text-[var(--color-success-foreground)]">
              Payment confirmed. Credentials are now available.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleLoadCredentials}
                className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
              >
                Reveal credentials
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        ) : null}

        {credentialItems.length > 0 ? (
          <div className="mt-6 rounded-3xl border border-border bg-bg/60 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Purchased credentials
            </p>
            <div className="mt-4 grid gap-4">
              {credentialItems.map((item, index) => (
                <div
                  key={`${order.id}-${index}`}
                  className="rounded-2xl border border-border bg-card px-4 py-4 text-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Account {index + 1}
                  </p>
                  <div className="mt-3 grid gap-3">
                    {Object.entries(item).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-border bg-bg px-4 py-3 text-sm"
                      >
                        <span className="font-semibold">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>Need help?</span>
          <Link href="/" className="text-primary underline-offset-4 hover:underline">
            Return to home
          </Link>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-[var(--color-success-border)] bg-[var(--color-success-soft)] p-4 text-sm text-[var(--color-success-foreground)]">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-6 rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger-foreground)]">
            {error}
          </div>
        ) : null}
      </section>
    </div>
  );
}
