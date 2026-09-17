"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

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

    if (!email || !password) {
      setError("Email and password are required.");
      setIsPending(false);
      return;
    }

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });

    if (signInError) {
      setError(signInError.message || "Failed to sign in. Try again.");
      setIsPending(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
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
          className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-foreground placeholder:text-stone-400 outline-none focus:border-accent focus:ring-2 focus:ring-ring"
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
          className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-foreground placeholder:text-stone-400 outline-none focus:border-accent focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full justify-center rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
