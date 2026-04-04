"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/use-auth-store";

type AuthMode = "login" | "register";

type ErrorPayload =
  | string
  | string[]
  | { detail?: string; non_field_errors?: string[]; [key: string]: unknown }
  | undefined;

function normalizeAuthMessage(message: string, mode: AuthMode, field?: string) {
  const trimmed = message.trim();
  const normalized = trimmed.toLowerCase();

  if (normalized.includes("invalid credentials")) {
    return "Your email, username, or password is incorrect.";
  }
  if (normalized.includes("pending") || normalized.includes("approval")) {
    return "Your account is waiting for admin approval. You can log in once it has been approved.";
  }
  if (normalized.includes("ensure this field has at least 8 characters")) {
    return "Password must be at least 8 characters long.";
  }
  if (normalized.includes("this field may not be blank")) {
    const label = field ? field.replaceAll("_", " ") : "This field";
    return `${label.charAt(0).toUpperCase()}${label.slice(1)} is required.`;
  }
  if (normalized.includes("this field is required")) {
    const label = field ? field.replaceAll("_", " ") : "This field";
    return `${label.charAt(0).toUpperCase()}${label.slice(1)} is required.`;
  }
  if (field === "email" && normalized.includes("already exists")) {
    return mode === "register"
      ? "That email is already registered. Use another email or sign in instead."
      : trimmed;
  }
  if (field === "username" && normalized.includes("already exists")) {
    return "That username is already in use. Choose a different username.";
  }

  return trimmed;
}

function extractAuthErrorMessage(payload: ErrorPayload, mode: AuthMode): string | null {
  if (!payload) return null;

  if (typeof payload === "string") {
    return normalizeAuthMessage(payload, mode);
  }

  if (Array.isArray(payload)) {
    const first = payload.find((item) => typeof item === "string");
    return first ? normalizeAuthMessage(first, mode) : null;
  }

  if (typeof payload === "object") {
    if (typeof payload.detail === "string") {
      return normalizeAuthMessage(payload.detail, mode);
    }

    if (Array.isArray(payload.non_field_errors) && payload.non_field_errors[0]) {
      return normalizeAuthMessage(payload.non_field_errors[0], mode);
    }

    const fieldOrder = ["email", "username", "password", "first_name", "last_name"];
    for (const field of fieldOrder) {
      const value = payload[field];
      if (typeof value === "string") {
        return normalizeAuthMessage(value, mode, field);
      }
      if (Array.isArray(value) && typeof value[0] === "string") {
        return normalizeAuthMessage(value[0], mode, field);
      }
    }

    for (const [field, value] of Object.entries(payload)) {
      if (typeof value === "string") {
        return normalizeAuthMessage(value, mode, field);
      }
      if (Array.isArray(value) && typeof value[0] === "string") {
        return normalizeAuthMessage(value[0], mode, field);
      }
    }
  }

  return null;
}

function getPasswordStrength(password: string) {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  if (!password) {
    return {
      score: 0,
      label: "Enter a password",
      hint: "Use at least 8 characters with a mix of letters, numbers, and symbols.",
      barClassName: "bg-slate-300 dark:bg-slate-700",
      textClassName: "text-muted",
    };
  }

  if (score <= 1) {
    return {
      score,
      label: "Weak",
      hint: "Add uppercase letters, numbers, or symbols to make it safer.",
      barClassName: "bg-[var(--color-danger)]",
      textClassName: "text-[var(--color-danger-foreground)]",
    };
  }

  if (score === 2) {
    return {
      score,
      label: "Fair",
      hint: "Good start. Add more variety to strengthen it.",
      barClassName: "bg-amber-500",
      textClassName: "text-amber-700 dark:text-amber-300",
    };
  }

  if (score === 3) {
    return {
      score,
      label: "Good",
      hint: "This password is solid. A symbol or extra length makes it even better.",
      barClassName: "bg-sky-500",
      textClassName: "text-sky-700 dark:text-sky-300",
    };
  }

  return {
    score,
    label: "Strong",
    hint: "Strong password.",
    barClassName: "bg-emerald-500",
    textClassName: "text-emerald-700 dark:text-emerald-300",
  };
}

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordStrength = getPasswordStrength(form.password);

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
        const created = await register({
          username: form.username || form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
        });
        if (created.is_active === false) {
          const pendingMessage =
            "Your account was created and is waiting for admin approval. You can log in once it is approved.";
          setError(pendingMessage);
          toast.success(pendingMessage);
          return;
        }
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
      if (typeof window !== "undefined") {
        window.location.assign(redirectTo);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
      toast.success(isRegister ? "Account created. Welcome!" : "Welcome back.");
    } catch (error) {
      const payload =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { data?: ErrorPayload } }).response?.data
          : undefined;
      const fallback = isRegister
        ? "We could not create your account right now. Please review your details and try again."
        : "We could not log you in right now. Please review your details and try again.";
      const message = extractAuthErrorMessage(payload, mode) ?? fallback;
      setError(message);
      toast.error(message);
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
        <span>Email or username</span>
        <input
          type="text"
          value={form.email}
          onChange={(event) => handleChange("email", event.target.value)}
          className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none placeholder:text-muted/70 focus:border-primary"
          placeholder="jane@company.com or janedoe"
        />
      </label>
      <label className="space-y-2 text-sm font-medium">
        <span>Password</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(event) => handleChange("password", event.target.value)}
            className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 pr-12 outline-none placeholder:text-muted/70 focus:border-primary"
            placeholder="********"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {isRegister ? (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full ${
                    index < passwordStrength.score
                      ? passwordStrength.barClassName
                      : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className={`font-semibold ${passwordStrength.textClassName}`}>
                {passwordStrength.label}
              </span>
              <span className="text-muted">{passwordStrength.hint}</span>
            </div>
          </div>
        ) : null}
      </label>
      {isRegister ? (
        <label className="space-y-2 text-sm font-medium">
          <span>Confirm password</span>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(event) =>
                handleChange("confirmPassword", event.target.value)
              }
              className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 pr-12 outline-none placeholder:text-muted/70 focus:border-primary"
              placeholder="********"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
      ) : null}
      {error ? (
        <p className="rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger-foreground)]">
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
