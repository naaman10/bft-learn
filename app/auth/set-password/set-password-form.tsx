"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth/client";
import { sendPasswordSetupOtp } from "./actions";

type AuthJson = {
  ok: boolean;
  status: number;
  body: unknown;
};

function errorMessageFromBody(body: unknown, fallback: string) {
  if (typeof body === "string" && body.trim()) {
    return body;
  }

  if (body && typeof body === "object") {
    if ("message" in body && typeof body.message === "string") {
      return body.message;
    }

    if ("error" in body && typeof body.error === "string") {
      return body.error;
    }
  }

  return fallback;
}

function isRetryableAuthFailure(result: AuthJson) {
  if (result.ok) {
    return false;
  }

  if (result.status === 502 || result.status === 503) {
    return true;
  }

  if (!result.body || typeof result.body !== "object") {
    return false;
  }

  const code = "code" in result.body ? result.body.code : null;
  return code === "NETWORK_RESET" || code === "NETWORK_TIMEOUT";
}

async function postAuthJson(
  path: string,
  body: Record<string, unknown>
): Promise<AuthJson> {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  return { ok: response.ok, status: response.status, body: parsed };
}

async function resetPasswordWithRetry(
  email: string,
  otp: string,
  password: string
) {
  let lastResult: AuthJson | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    lastResult = await postAuthJson("email-otp/reset-password", {
      email,
      otp,
      password,
    });

    if (lastResult.ok) {
      return lastResult;
    }

    if (!isRetryableAuthFailure(lastResult) || attempt === 3) {
      return lastResult;
    }

    await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
  }

  return lastResult!;
}

export function SetPasswordForm({ email }: { email: string }) {
  const [step, setStep] = useState<"password" | "otp">("password");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (step === "password") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      startTransition(async () => {
        const result = await sendPasswordSetupOtp();
        if (result?.error) {
          console.error("[set-password] Failed to send OTP", result.error);
          setError(result.error);
          return;
        }
        setStep("otp");
      });
      return;
    }

    startTransition(async () => {
      const reset = await resetPasswordWithRetry(email, otp.trim(), password);

      if (!reset.ok) {
        console.error("[set-password] Neon Auth reset failed", {
          status: reset.status,
          body: reset.body,
        });
      }

      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (!signInError) {
        window.location.replace("/dashboard");
        return;
      }

      if (reset.ok) {
        console.error(
          "[set-password] Password set but sign-in failed",
          signInError
        );
        window.location.replace("/auth/sign-in");
        return;
      }

      setError(
        isRetryableAuthFailure(reset)
          ? "The confirmation code may have expired. Request a new code and try again."
          : errorMessageFromBody(
              reset.body,
              "Failed to set password. Check the code and try again."
            )
      );
    });
  }

  function resendCode() {
    setError(null);
    startTransition(async () => {
      const result = await sendPasswordSetupOtp();
      if (result?.error) {
        console.error("[set-password] Failed to resend OTP", result.error);
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {step === "password" ? (
        <>
          <p className="text-sm text-stone-600">
            Choose a password for next time. We’ll email a confirmation code to{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </p>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="block min-h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-stone-400 outline-none focus:border-accent focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-foreground"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              className="block min-h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-stone-400 outline-none focus:border-accent focus:ring-2 focus:ring-ring"
            />
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-stone-600">
            Enter the 6-digit code we sent to{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </p>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="otp" className="text-sm font-medium text-foreground">
              Confirmation code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={8}
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="123456"
              className="block min-h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 tracking-widest text-base text-foreground placeholder:text-stone-400 outline-none focus:border-accent focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="button"
            onClick={resendCode}
            disabled={isPending}
            className="self-start text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-60"
          >
            Resend code
          </button>
        </>
      )}

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
        {isPending
          ? step === "password"
            ? "Sending code…"
            : "Saving…"
          : step === "password"
            ? "Continue"
            : "Set password"}
      </button>
    </form>
  );
}
