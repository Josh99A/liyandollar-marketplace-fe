import { create } from "zustand";
import type { ApiUser } from "@/types";
import * as authService from "@/lib/services/auth";

type AuthStore = {
  user: ApiUser | null;
  isLoading: boolean;
  hasBootstrapped: boolean;
  bootstrap: () => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<ApiUser>;
  register: (payload: {
    email: string;
    password: string;
    username: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<ApiUser>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  hasBootstrapped: false,
  bootstrap: async () => {
    if (get().hasBootstrapped) return;
    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, hasBootstrapped: true, isLoading: false });
    } catch {
      set({ user: null, hasBootstrapped: true, isLoading: false });
    }
  },
  login: async (payload) => {
    set({ isLoading: true });
    const user = await authService.login(payload);
    set({ user, isLoading: false, hasBootstrapped: true });
    return user;
  },
  register: async (payload) => {
    set({ isLoading: true });
    const user = await authService.register(payload);
    set({ user, isLoading: false, hasBootstrapped: true });
    return user;
  },
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      set({ user: null, isLoading: false, hasBootstrapped: true });
    }
  },
}));
