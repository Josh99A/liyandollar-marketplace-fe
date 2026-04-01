import { create } from "zustand";
import type { ApiUser } from "@/types";
import * as authService from "@/lib/services/auth";

const setAuthSessionCookie = () => {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? " Secure;" : "";
  document.cookie = `auth-session=1; Path=/; SameSite=Lax;${secure}`;
};

const clearAuthSessionCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = "auth-session=; Path=/; Max-Age=0; SameSite=Lax;";
};

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
      setAuthSessionCookie();
    } catch {
      set({ user: null, hasBootstrapped: true, isLoading: false });
      clearAuthSessionCookie();
    }
  },
  login: async (payload) => {
    set({ isLoading: true });
    const user = await authService.login(payload);
    set({ user, isLoading: false, hasBootstrapped: true });
    setAuthSessionCookie();
    return user;
  },
  register: async (payload) => {
    set({ isLoading: true });
    const user = await authService.register(payload);
    if (user.is_active === false) {
      set({ user: null, isLoading: false, hasBootstrapped: true });
      clearAuthSessionCookie();
    } else {
      set({ user, isLoading: false, hasBootstrapped: true });
      setAuthSessionCookie();
    }
    return user;
  },
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      set({ user: null, isLoading: false, hasBootstrapped: true });
      clearAuthSessionCookie();
    }
  },
}));
