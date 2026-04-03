"use client";

import Link from "next/link";
import { Copy, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { SectionHeading } from "@/components/ui/section-heading";

export function SuccessClient({
  accessUrl,
  isGuest,
  orderNumber,
  orderPath,
}: {
  accessUrl: string;
  isGuest: boolean;
  orderNumber: string;
  orderPath: string;
}) {
  const handleCopy = async () => {
    if (!accessUrl) return;
    await navigator.clipboard.writeText(accessUrl);
    toast.success("Guest access link copied.");
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Checkout Success"
        title={isGuest ? "Your guest order is ready to track" : "Your order was created"}
        description={
          isGuest
            ? "Save the secure link below. It is the private way to return to your purchase, view payment status, and unlock credentials after confirmation."
            : "Use your dashboard to track payment confirmation and access purchased credentials once the order is paid."
        }
      />

      <section className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-accent p-3 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Order number
            </p>
            <p className="mt-2 text-2xl font-semibold">{orderNumber || "Pending assignment"}</p>
            {isGuest ? (
              <>
                <p className="mt-5 text-sm font-semibold text-foreground">
                  Save this link. It is the secure way to access your purchase later.
                </p>
                <p className="mt-2 break-all rounded-2xl border border-border bg-bg/60 px-4 py-3 font-mono text-sm text-muted">
                  {accessUrl || "Guest access link unavailable."}
                </p>
                <p className="mt-3 text-sm text-muted">Do not share this link.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!accessUrl}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <Copy className="h-4 w-4" />
                    Copy link
                  </button>
                  <Link
                    href={orderPath || "/"}
                    className="rounded-full border border-border px-5 py-3 text-sm font-semibold"
                  >
                    View order
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-5">
                <Link
                  href="/dashboard/orders"
                  className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
                >
                  Open dashboard orders
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
