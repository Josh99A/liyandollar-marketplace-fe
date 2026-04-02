import { ProductBrowser } from "@/components/marketplace/product-browser";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProducts } from "@/lib/services/catalog";

function pickFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const products = await getProducts();
  const params = await searchParams;
  const initialCategory = pickFirst(params.category) ?? "All";
  const initialTag = pickFirst(params.tag) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="space-y-8">
        <SectionHeading
          eyebrow="All Products"
          title="Filter every digital product from the home page"
          description="Browse everything from one place, then narrow results with search, categories, or clickable case-insensitive tags directly from the product cards."
        />
        <ProductBrowser
          initialCategory={initialCategory}
          initialTag={initialTag}
          products={products}
        />
      </section>
    </div>
  );
}
