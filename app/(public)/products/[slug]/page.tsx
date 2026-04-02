import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeDollarSign, CreditCard, Shield, Star } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProductBySlug } from "@/lib/services/catalog";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-border bg-card/75 p-6 shadow-[var(--shadow-soft)] backdrop-blur lg:p-8">
          <div
            className={`mb-8 h-64 rounded-[1.5rem] bg-gradient-to-br ${product.gradient}`}
          />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-accent px-3 py-1.5 font-semibold text-primary">
              {product.category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-muted">
              <Star className="h-4 w-4 fill-current text-amber-400" />
              {product.rating}
            </span>
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-base leading-8 text-muted">
            {product.longDescription}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-bg/60 p-4">
              <BadgeDollarSign className="mb-3 h-5 w-5 text-primary" />
              <p className="text-xs uppercase tracking-[0.28em] text-muted">
                Price
              </p>
              <p className="mt-2 text-xl font-semibold">${product.price.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-bg/60 p-4">
              <Shield className="mb-3 h-5 w-5 text-primary" />
              <p className="text-xs uppercase tracking-[0.28em] text-muted">
                Delivery
              </p>
              <p className="mt-2 text-xl font-semibold">{product.delivery}</p>
            </div>
            <div className="rounded-2xl border border-border bg-bg/60 p-4">
              <CreditCard className="mb-3 h-5 w-5 text-primary" />
              <p className="text-xs uppercase tracking-[0.28em] text-muted">
                Stock
              </p>
              <p className="mt-2 text-xl font-semibold">{product.stockStatus}</p>
            </div>
          </div>
        </div>

        <aside className="space-y-6 rounded-[2rem] border border-border bg-card/90 p-6 shadow-[var(--shadow-soft)]">
          <SectionHeading
            eyebrow="Order summary"
            title="Checkout-ready details"
            description="The frontend supports guest checkout today and can swap to API-fed pricing, fees, and promotions later."
          />
          <div className="space-y-4 rounded-3xl border border-border bg-bg/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="font-semibold">${product.price.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Service fee</span>
              <span className="font-semibold">$2.50</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted">Total</span>
              <span className="text-2xl font-bold">
                ${(product.price + 2.5).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href={`/checkout?product=${product.slug}`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5"
            >
              Continue to checkout
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:-translate-y-0.5"
            >
              Back to home
            </Link>
          </div>
          <div className="rounded-3xl border border-dashed border-border p-5">
            <p className="text-sm text-muted">
              Preview: <span className="font-medium text-foreground">{product.credentialsPreview}</span>
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
