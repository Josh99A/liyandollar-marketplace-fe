import { apiClient } from "@/lib/api/client";
import type { ApiUser } from "@/types";

type AuthPayload = {
  email: string;
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export async function register(payload: AuthPayload) {
  const response = await apiClient.post<ApiUser>("/api/auth/register/", payload);
  return response.data;
}

export async function login(payload: Pick<AuthPayload, "email" | "password">) {
  const response = await apiClient.post<ApiUser>("/api/auth/login/", payload);
  return response.data;
}

export async function logout() {
  await apiClient.post("/api/auth/logout/");
}

export async function getCurrentUser() {
  const response = await apiClient.get<ApiUser>("/api/auth/me/");
  return response.data;
}
