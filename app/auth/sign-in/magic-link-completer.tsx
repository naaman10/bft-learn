"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { completeMagicLinkSession } from "./actions";
import { SignInForm } from "./sign-in-form";

const EXPIRED_LINK_ERROR = "This sign-in link is invalid or has expired.";

export function MagicLinkCompleter({ verifier }: { verifier: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      try {
        const result = await completeMagicLinkSession(verifier);

        if (cancelled) {
          return;
        }

        if (!result?.error) {
          return;
        }
      } catch {
        // Fall through to the client SDK exchange.
      }

      try {
        const { data, error: sessionError } = await authClient.getSession();

        if (cancelled) {
          return;
        }

        if (!sessionError && data?.user) {
          router.replace("/auth/set-password");
          return;
        }
      } catch {
        // Invalid or expired verifier.
      }

      if (!cancelled) {
        setError(EXPIRED_LINK_ERROR);
      }
    }

    void complete();

    return () => {
      cancelled = true;
    };
  }, [verifier, router]);

  if (error) {
    return <SignInForm initialError={error} />;
  }

  return <p className="text-center text-base text-muted">Signing you in…</p>;
}
