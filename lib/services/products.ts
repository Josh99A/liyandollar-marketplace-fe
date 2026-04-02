import { apiClient } from "@/lib/api/client";
import type { Product } from "@/types";

type ProductApiResponse = {
  id: number;
  title: string;
  slug: string;
  category: string;
  subcategory?: string;
  category_icon?: string | null;
  subcategory_icon?: string | null;
  description: string;
  image: string | null;
  price_usd: string;
  status: string;
  stock_count: number;
  single_item: boolean;
};

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
    subcategory: product.subcategory ?? undefined,
    categoryIcon: product.category_icon ?? null,
    subcategoryIcon: product.subcategory_icon ?? null,
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
    tags: [product.category.toLowerCase()],
    credentialsPreview: "Unlocked only after admin payment confirmation",
    credentialsData: undefined,
    gradient: gradients[index % gradients.length],
    featured: index < 3,
  };
}

export async function getProductsClient() {
  try {
    const response = await apiClient.get<ProductApiResponse[]>("/api/products/");
    return response.data.map(mapProduct);
  } catch {
    return [];
  }
}

export async function getProductBySlugClient(slug: string) {
  const products = await getProductsClient();
  return products.find((product) => product.slug === slug) ?? null;
}
