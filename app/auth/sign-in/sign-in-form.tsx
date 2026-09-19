"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function SignInForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    console.log("[sign-in] Attempting sign-in", {
      email,
      hasPassword: !!password,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
    });

    if (!email || !password) {
      setError("Email and password are required.");
      setIsPending(false);
      return;
    }

    try {
      // Use direct fetch with explicit credentials handling for mobile Safari compatibility
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("[sign-in] Authentication failed", {
          status: response.status,
          statusText: response.statusText,
          data,
          email,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        });
        throw new Error(
          data?.message || data?.error || "Failed to sign in. Try again."
        );
      }

      console.log("[sign-in] Authentication successful");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign in. Try again.";
      console.error("[sign-in] Sign-in error:", err);
      setError(errorMessage);
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="block min-h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-stone-400 outline-none focus:border-accent focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="block min-h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-stone-400 outline-none focus:border-accent focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-error-bg px-4 py-3 text-sm text-error"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-4 text-base font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
