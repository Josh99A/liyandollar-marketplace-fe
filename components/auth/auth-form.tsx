"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/use-auth-store";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      if (isRegister) {
        if (form.password !== form.confirmPassword) {
          setError("Passwords do not match.");
          toast.error("Passwords do not match.");
          return;
        }
        await register({
          username: form.username || form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
        });
      } else {
        await login({
          email: form.email,
          password: form.password,
        });
      }

      const redirectTo =
        typeof window === "undefined"
          ? "/dashboard"
          : new URLSearchParams(window.location.search).get("redirect") ?? "/dashboard";
      router.push(redirectTo);
      router.refresh();
      toast.success(isRegister ? "Account created. Welcome!" : "Welcome back.");
    } catch {
      setError("Authentication failed. Check your details and try again.");
      toast.error("Authentication failed. Please try again.");
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {isRegister ? (
        <>
          <label className="space-y-2 text-sm font-medium">
            <span>Username</span>
            <input
              value={form.username}
              onChange={(event) => handleChange("username", event.target.value)}
              className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
              placeholder="liyandollar_user"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>First name</span>
            <input
              value={form.first_name}
              onChange={(event) =>
                handleChange("first_name", event.target.value)
              }
              className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
              placeholder="Jane"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Last name</span>
            <input
              value={form.last_name}
              onChange={(event) => handleChange("last_name", event.target.value)}
              className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
              placeholder="Doe"
            />
          </label>
        </>
      ) : null}
      <label className="space-y-2 text-sm font-medium">
        <span>Email address</span>
        <input
          type="email"
          value={form.email}
          onChange={(event) => handleChange("email", event.target.value)}
          className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
          placeholder="jane@company.com"
        />
      </label>
      <label className="space-y-2 text-sm font-medium">
        <span>Password</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => handleChange("password", event.target.value)}
          className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
          placeholder="••••••••"
        />
      </label>
      {isRegister ? (
        <label className="space-y-2 text-sm font-medium">
          <span>Confirm password</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) =>
              handleChange("confirmPassword", event.target.value)
            }
            className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
            placeholder="••••••••"
          />
        </label>
      ) : null}
      {error ? (
        <p className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading
          ? "Please wait..."
          : isRegister
            ? "Create account"
            : "Sign in"}
      </button>
    </form>
  );
}
