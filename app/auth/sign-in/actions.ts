"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { hasCredentialAccount } from "@/lib/auth/accounts";

export async function completeMagicLinkSession(verifier: string) {
  if (!verifier) {
    return { error: "This sign-in link is invalid or has expired." };
  }

  try {
    const { data: session, error } = await auth.getSession({
      query: {
        disableCookieCache: "true",
        neon_auth_session_verifier: verifier,
      } as { disableCookieCache: string },
    });

    if (error || !session?.user) {
      return { error: "This sign-in link is invalid or has expired." };
    }
  } catch {
    return { error: "This sign-in link is invalid or has expired." };
  }

  if (await hasCredentialAccount()) {
    redirect("/dashboard");
  }

  redirect("/auth/set-password");
}
