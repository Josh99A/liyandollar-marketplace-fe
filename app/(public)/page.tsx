import Link from "next/link";
import { ArrowRight, ShieldCheck, WalletCards, Zap } from "lucide-react";
import { ProductBrowser } from "@/components/marketplace/product-browser";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProducts } from "@/lib/services/catalog";

const highlights = [
  {
    title: "Instant digital fulfillment",
    description: "Automated delivery flows for product credentials moments after successful payment.",
    icon: Zap,
  },
  {
    title: "Wallet-powered checkout",
    description: "Balance visibility, deposits, and transaction history built into the customer dashboard.",
    icon: WalletCards,
  },
  {
    title: "Safer purchase management",
    description: "Protected authenticated area, secure cookie-based sessions, and downloadable order records.",
    icon: ShieldCheck,
  },
];

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(11,95,216,0.06),rgba(76,203,112,0.08))] px-6 py-8 shadow-[var(--shadow-soft)] dark:bg-[linear-gradient(135deg,rgba(5,26,46,0.94),rgba(7,43,75,0.96),rgba(11,95,216,0.86))] sm:px-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(76,203,112,0.22),transparent_65%)] lg:block" />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex rounded-full border border-border bg-card/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
              Digital assets marketplace
            </span>
            <div className="space-y-3">
              <h1 className="font-display text-3xl font-bold tracking-tight text-balance text-foreground dark:text-white sm:text-4xl lg:text-5xl">
                Browse digital products and pay with admin-confirmed crypto checkout.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-200 sm:text-base">
                Facebook accounts, Instagram accounts, emails, and region-specific gift cards can all be added by admins from the backend and filtered by customers from one clean catalog.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg"
              >
                Explore marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-border bg-card/85 px-6 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5"
              >
                Create account
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {highlights.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="card-surface rounded-3xl p-4 backdrop-blur"
              >
                <div className="mb-3 inline-flex rounded-2xl bg-accent p-3 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="mb-2 text-base font-semibold">{title}</h2>
                <p className="text-sm leading-6 text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="All Products"
          title="Filter every digital product from the home page"
          description="Categories are driven by admin-managed products, so new inventory types and gift-card regions automatically appear in the filter system."
          action={{
            href: "/marketplace",
            label: "Open full marketplace",
          }}
        />
        <ProductBrowser products={products} />
      </section>
    </div>
  );
}
