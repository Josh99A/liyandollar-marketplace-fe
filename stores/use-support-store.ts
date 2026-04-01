"use client";

import { create } from "zustand";

type SupportStore = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useSupportStore = create<SupportStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
