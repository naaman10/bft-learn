"use client";

import { useActionState } from "react";
import { signInWithEmail } from "./actions";

export function SignInForm({ initialError }: { initialError?: string }) {
  const [state, formAction, isPending] = useActionState(
    signInWithEmail,
    initialError ? { error: initialError } : null
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
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

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error"
        >
          {state.error}
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
