import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-border bg-card/90 p-8 shadow-[var(--shadow-soft)]">
          <AuthForm mode="register" />
          <p className="mt-6 text-sm text-muted">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Sign in
            </Link>
          </p>
        </div>
        <div className="rounded-[2rem] border border-border bg-card/80 p-8 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Create account
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold">
            Unlock wallet funding, transaction history, and instant credential downloads.
          </h1>
          <p className="mt-4 text-base leading-8 text-muted">
            Public browsing stays frictionless, while the authenticated experience centralizes post-purchase workflows inside a protected dashboard layout.
          </p>
        </div>
      </div>
    </div>
  );
}
