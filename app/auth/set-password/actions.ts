"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";

function errorMessageFromBody(body: unknown): string | null {
  if (typeof body === "string" && body.trim()) {
    return body;
  }

  if (!body || typeof body !== "object") {
    return null;
  }

  if ("message" in body && typeof body.message === "string") {
    return body.message;
  }

  if (
    "error" in body &&
    body.error &&
    typeof body.error === "object" &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) {
    return body.error.message;
  }

  if ("error" in body && typeof body.error === "string") {
    return body.error;
  }

  return null;
}

async function postAuthJson(path: string[], body: Record<string, unknown>) {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const origin = headerStore.get("origin") ?? `${proto}://${host}`;

  const { POST } = auth.handler();
  const response = await POST(
    new Request(`${origin}/api/auth/${path.join("/")}`, {
      method: "POST",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
        "content-type": "application/json",
        origin,
      },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ path }) }
  );

  const raw = await response.text();
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (!response.ok) {
    console.error("[set-password] Neon Auth error", {
      path: path.join("/"),
      status: response.status,
      body: raw.slice(0, 500),
    });
  }

  return { ok: response.ok, body: parsed };
}

export async function sendPasswordSetupOtp() {
  const { data: session } = await auth.getSession();
  const email = session?.user?.email;

  if (!email) {
    return { error: "Your session expired. Sign in again with the magic link." };
  }

  const response = await postAuthJson(
    ["email-otp", "request-password-reset"],
    { email }
  );

  if (!response.ok) {
    return {
      error:
        errorMessageFromBody(response.body) ||
        "Failed to send a confirmation code. Try again.",
    };
  }

  return null;
}
