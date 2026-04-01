"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

const STORAGE_KEY = "api-base-url-warning";

export function ApiHealthCheck() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    const normalized = baseUrl.replace(/\/+$/, "");
    const origin = window.location.origin.replace(/\/+$/, "");
    if (!normalized) return;

    const warned = window.sessionStorage.getItem(STORAGE_KEY);
    if (warned) return;

    if (normalized === origin) {
      toast.error(
        "API base URL points to the frontend. Please set NEXT_PUBLIC_API_URL to your backend.",
      );
      window.sessionStorage.setItem(STORAGE_KEY, "1");
      return;
    }

    if (!normalized.startsWith("http")) {
      toast.error("API base URL looks invalid. Check NEXT_PUBLIC_API_URL.");
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    }
  }, []);

  return null;
}
