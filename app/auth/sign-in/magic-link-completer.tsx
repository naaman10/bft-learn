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

        if (result?.error) {
          // Server action returned an error, try client SDK fallback
          throw new Error(result.error);
        }

        // Server action succeeded but didn't redirect (shouldn't happen),
        // fall through to client SDK check
      } catch (error) {
        // Check if this is a Next.js redirect error that should propagate
        if (error && typeof error === "object" && "digest" in error) {
          const digest = (error as { digest?: string }).digest;
          if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
            // This is a redirect from the server action, let it propagate
            throw error;
          }
        }
        // Fall through to the client SDK exchange for other errors
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
