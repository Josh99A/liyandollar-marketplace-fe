import { ProductBrowser } from "@/components/marketplace/product-browser";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProducts } from "@/lib/services/catalog";

export default async function MarketplacePage() {
  const products = await getProducts();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <SectionHeading
        eyebrow="Marketplace"
        title="Browse digital inventory across accounts, emails, and gift cards"
        description="Public users can discover products and begin checkout immediately, while authenticated flows unlock wallet and order management."
      />

      <ProductBrowser products={products} />
    </div>
  );
}
