"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, LoaderCircle } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  downloadCredentialsPdf,
  getCredentials,
  getOrder,
  getPaymentDetails,
  submitPayment,
} from "@/lib/services/orders";
import { normalizeCredentialsCollection } from "@/lib/utils/credentials";
import type { CredentialsResponse, Order, PaymentDetailsResponse } from "@/types";

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    awaiting_confirmation: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    paid: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    cancelled: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
    failed: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  } as const;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${styles[status as keyof typeof styles] ?? "bg-slate-500/12 text-slate-700 dark:text-slate-100"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsResponse | null>(null);
  const [credentials, setCredentials] = useState<CredentialsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const [note, setNote] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const latestSubmission = order?.payment_submissions?.[order.payment_submissions.length - 1] ?? null;
  const credentialItems = normalizeCredentialsCollection(credentials?.credentials);

  useEffect(() => {
    const load = async () => {
      try {
        const currentOrder = await getOrder(orderId);
        setOrder(currentOrder);
        if (currentOrder.selected_payment_asset) {
          const details = await getPaymentDetails(orderId);
          setPaymentDetails(details);
        }
      } catch {
        setError("Unable to load this order.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [orderId]);

  const handleSubmitPayment = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitPayment(orderId, {
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
      const response = await getCredentials(orderId);
      setCredentials(response);
    } catch {
      setError("Credentials are not available yet.");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await downloadCredentialsPdf(orderId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `order-${orderId}-credentials.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Unable to download the PDF.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-[1.75rem] border border-border bg-card/90 p-6">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm text-muted">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return <div className="rounded-[1.75rem] border border-border bg-card/90 p-6">Order not found.</div>;
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Order Details"
        title={order.product.name}
        description="Payment proof stays pending until an admin reviews and confirms the transfer. Only paid orders can reveal credentials or download the PDF record."
      />

      <div className="rounded-[1.75rem] border border-border bg-card/90 p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <StatusBadge status={order.status} />
                <p className="mt-3 text-sm text-muted">Order reference: {order.reference}</p>
                <p className="mt-1 text-sm text-muted">Quantity: {order.quantity ?? 1}</p>
              </div>
          <div className="rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm">
            Expected amount <span className="font-semibold">${Number(order.amount_expected).toFixed(2)}</span>
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
              <p className="mt-4 break-all rounded-2xl border border-border bg-card px-4 py-3 font-mono text-sm">
                {paymentDetails.asset.wallet_address}
              </p>
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
                {paymentDetails.asset.instructions || "Send payment, then submit both the transaction hash / ID and your screenshot for manual review."}
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
                    {screenshot ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-300">
                        Selected file: {screenshot.name}
                      </span>
                    ) : null}
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
                  {!txHash.trim() || !screenshot ? (
                    <p className="text-xs text-muted">
                      Add both the transaction hash / ID and payment screenshot before submitting.
                    </p>
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
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-border bg-bg/60 p-5 text-sm text-muted">
            No payment asset has been assigned to this order yet.
          </div>
        )}

        {order.status === "paid" ? (
          <div className="mt-6 rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-5">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
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

        {message ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-6 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
