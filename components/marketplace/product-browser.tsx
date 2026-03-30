"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/marketplace/product-card";
import type { Product } from "@/types";

export function ProductBrowser({
  products,
}: {
  products: Product[];
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, products, query]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border bg-card/80 p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-primary text-white shadow-lg"
                      : "border border-border bg-bg/70 text-muted hover:border-primary/35 hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          <label className="relative block w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-full border border-border bg-bg/70 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-muted/70 focus:border-primary"
              placeholder="Search digital products"
            />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> product{filteredProducts.length === 1 ? "" : "s"}
        </p>
        <p className="text-sm text-muted">
          Categories are admin-managed from the backend
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
