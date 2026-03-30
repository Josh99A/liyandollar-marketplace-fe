"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { getOrders } from "@/lib/services/orders";
import type { Order } from "@/types";

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

export function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getOrders();
        setOrders(response);
      } catch {
        setError("Unable to load orders right now.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Orders"
        title="Track manual payment confirmation and unlock credentials only after approval"
        description="Each order keeps payment instructions, proof submission, and credential access in one secure flow."
      />

      {loading ? (
        <div className="flex items-center gap-3 rounded-[1.75rem] border border-border bg-card/90 p-6">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted">Loading orders...</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.75rem] border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <StatusBadge status={order.status} />
                <h2 className="mt-3 text-xl font-semibold">{order.product.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  Ref: {order.reference} • {order.selected_payment_asset?.symbol ?? "No asset selected yet"}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm">
                  Expected <span className="font-semibold">${Number(order.amount_expected).toFixed(2)}</span>
                </div>
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  View order
                </Link>
              </div>
            </div>
          </article>
        ))}
        {!loading && !orders.length ? (
          <div className="rounded-[1.75rem] border border-border bg-card/90 p-6 text-sm text-muted">
            No orders yet. Start from the marketplace and create your first crypto checkout.
          </div>
        ) : null}
      </div>
    </div>
  );
}
