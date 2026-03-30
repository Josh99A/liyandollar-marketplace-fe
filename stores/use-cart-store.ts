import { create } from "zustand";

type CartState = {
  selectedProductSlug: string | null;
  setSelectedProductSlug: (slug: string | null) => void;
};

export const useCartStore = create<CartState>((set) => ({
  selectedProductSlug: null,
  setSelectedProductSlug: (selectedProductSlug) => set({ selectedProductSlug }),
}));
