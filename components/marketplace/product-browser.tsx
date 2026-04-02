"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/marketplace/product-card";
import { normalizeTag } from "@/lib/utils/product-tags";
import type { Product } from "@/types";

export function ProductBrowser({
  initialCategory = "All",
  initialTag = null,
  products,
}: {
  initialCategory?: string;
  initialTag?: string | null;
  products: Product[];
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory || "All");
  const [activeTag, setActiveTag] = useState(initialTag);
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedActiveTag = activeTag ? normalizeTag(activeTag) : null;

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const matchesTag =
        !normalizedActiveTag ||
        product.tags.some((tag) => normalizeTag(tag) === normalizedActiveTag);
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery) ||
        product.tags.some((tag) => normalizeTag(tag).includes(normalizedQuery));
      return matchesCategory && matchesTag && matchesQuery;
    });
  }, [activeCategory, activeTag, products, query]);

  const hasActiveFilters =
    activeCategory !== "All" || Boolean(activeTag) || Boolean(query.trim());

  const relatedTags = useMemo(() => {
    const sourceProducts =
      activeCategory === "All"
        ? products
        : products.filter((product) => product.category === activeCategory);

    const counts = new Map<string, number>();

    for (const product of sourceProducts) {
      for (const tag of product.tags) {
        const normalized = normalizeTag(tag);
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .filter(([tag]) => tag !== normalizeTag(activeTag ?? ""))
      .sort((first, second) => {
        if (second[1] !== first[1]) {
          return second[1] - first[1];
        }

        return first[0].localeCompare(second[0]);
      })
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [activeCategory, activeTag, products]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border bg-card/80 p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
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

          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>Active filters:</span>
              {activeCategory !== "All" ? (
                <span className="rounded-full bg-bg px-3 py-1 font-medium text-foreground">
                  Category: {activeCategory}
                </span>
              ) : null}
              {activeTag ? (
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className="rounded-full bg-bg px-3 py-1 font-medium text-foreground hover:text-primary"
                >
                  Tag: #{normalizeTag(activeTag)} x
                </button>
              ) : null}
              {query.trim() ? (
                <span className="rounded-full bg-bg px-3 py-1 font-medium text-foreground">
                  Search: {query.trim()}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All");
                  setActiveTag(null);
                  setQuery("");
                }}
                className="rounded-full border border-border px-3 py-1 font-semibold text-foreground hover:border-primary hover:text-primary"
              >
                Clear filters
              </button>
            </div>
          ) : null}

          {relatedTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{activeCategory === "All" ? "Popular tags:" : "Related tags:"}</span>
              {relatedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className="rounded-full border border-border bg-bg/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-primary hover:text-primary"
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span>{" "}
          product{filteredProducts.length === 1 ? "" : "s"}
        </p>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onTagClick={(tag) => setActiveTag(normalizeTag(tag))}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted">
          No products match the current filters. Clear filters or try another tag.
        </div>
      )}
    </div>
  );
}
