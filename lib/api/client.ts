import axios from "axios";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const hasApiSuffix = normalizedBaseUrl.endsWith("/api");

export const apiClient = axios.create({
  baseURL: normalizedBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (hasApiSuffix && typeof config.url === "string" && config.url.startsWith("/api/")) {
    config.url = config.url.replace(/^\/api/, "");
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
