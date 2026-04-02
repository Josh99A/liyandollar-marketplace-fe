import Link from "next/link";
import type { Product } from "@/types";

export function CheckoutSummary({ product, quantity = 1 }: { product: Product; quantity?: number }) {
  const serviceFee = 2.5;
  const subtotal = product.price * quantity;
  const total = subtotal + serviceFee;

  return (
    <aside className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-[var(--shadow-soft)]">
      <h2 className="text-2xl font-semibold">Order summary</h2>
      <div
        className={`mt-6 h-48 rounded-[1.5rem] bg-gradient-to-br ${product.gradient}`}
      />
      <div className="mt-5">
        <p className="text-sm uppercase tracking-[0.22em] text-primary">
          {product.category}
        </p>
        <h3 className="mt-2 text-xl font-semibold">{product.name}</h3>
        <p className="mt-2 text-sm leading-7 text-muted">
          {product.description}
        </p>
      </div>
      <div className="mt-6 space-y-4 rounded-3xl border border-border bg-bg/65 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Quantity</span>
          <span className="font-semibold">{quantity}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Service fee</span>
          <span className="font-semibold">${serviceFee.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted">Total</span>
          <span className="text-2xl font-bold">${total.toFixed(2)}</span>
        </div>
      </div>
      <div className="mt-5 rounded-3xl border border-border bg-bg/65 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
          Crypto settlement
        </p>
        <div className="mt-4 space-y-3 text-sm text-muted">
          <div className="flex items-center justify-between">
            <span>Supported assets</span>
            <span className="font-semibold text-foreground">USDT, BTC, ETH</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Verification</span>
            <span className="font-semibold text-foreground">Tx hash required</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Delivery trigger</span>
            <span className="font-semibold text-foreground">After confirmation</span>
          </div>
        </div>
      </div>
      <Link
        href={`/products/${product.slug}`}
        className="mt-5 inline-flex text-sm font-semibold text-primary"
      >
        Review product details
      </Link>
    </aside>
  );
}
