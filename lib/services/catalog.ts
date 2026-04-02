import type { Product } from "@/types";
import { buildProductTags } from "@/lib/utils/product-tags";

type ProductApiResponse = {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string;
  image: string | null;
  price_usd: string;
  status: string;
  stock_count: number;
  single_item: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const gradients = [
  "from-sky-500 via-blue-600 to-indigo-700",
  "from-cyan-400 via-sky-500 to-blue-700",
  "from-emerald-400 via-teal-500 to-cyan-700",
  "from-violet-500 via-fuchsia-600 to-rose-600",
  "from-amber-400 via-orange-500 to-red-600",
  "from-slate-500 via-slate-700 to-slate-900",
];

function mapProduct(product: ProductApiResponse, index = 0): Product {
  return {
    id: String(product.id),
    slug: product.slug,
    name: product.title,
    category: product.category,
    description: product.description,
    longDescription: product.description,
    image: product.image,
    price: Number(product.price_usd),
    rating: 4.8,
    stockStatus:
      product.status === "available"
        ? product.stock_count > 1
          ? `In stock (${product.stock_count})`
          : "Low stock"
        : "Unavailable",
    statusValue: product.status,
    stockCount: product.stock_count,
    singleItem: product.single_item,
    delivery: "After payment confirmation",
    tags: buildProductTags({
      category: product.category,
      name: product.title,
      subcategory: undefined,
    }),
    credentialsPreview: "Unlocked only after admin confirmation",
    credentialsData: undefined,
    gradient: gradients[index % gradients.length],
    featured: index < 3,
  };
}

export async function getProducts() {
  try {
    const response = await fetch(`${API_URL}/api/products/`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as ProductApiResponse[];
    return data.map(mapProduct);
  } catch {
    return [];
  }
}

export async function getFeaturedProducts() {
  const products = await getProducts();
  return products.filter((product) => product.featured);
}

export async function getProductBySlug(slug: string) {
  const products = await getProducts();
  return products.find((product) => product.slug === slug);
}
