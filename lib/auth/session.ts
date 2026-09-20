import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { proxyNeonAuthRequest } from "@/lib/auth/neon-proxy";

const FORWARDED_HEADERS = [
  "authorization",
  "cookie",
  "host",
  "origin",
  "referer",
  "user-agent",
  "x-forwarded-host",
  "x-forwarded-proto",
] as const;

function isCookieMutationError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  if ("__NEXT_ERROR_CODE" in error && error.__NEXT_ERROR_CODE === "E1180") {
    return true;
  }

  return (
    error instanceof Error &&
    error.message.includes("Cookies can only be modified in a Server Action")
  );
}

async function readAuthEndpoint(
  path: string[],
  query?: Record<string, unknown>
) {
  const incoming = await headers();
  const requestHeaders = new Headers();

  for (const name of FORWARDED_HEADERS) {
    const value = incoming.get(name);
    if (value) {
      requestHeaders.set(name, value);
    }
  }

  const host =
    incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost";
  const proto = incoming.get("x-forwarded-proto") ?? "http";
  const url = new URL(
    `${proto}://${host.split(",")[0].trim()}/${path.join("/")}`
  );

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value != null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await proxyNeonAuthRequest(
    new Request(url, {
      method: "GET",
      headers: requestHeaders,
    }),
    path
  );
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      data: null,
      error: {
        message:
          data && typeof data === "object" && "message" in data
            ? String(data.message)
            : "Failed to load auth data.",
        status: response.status,
      },
    };
  }

  return { data, error: null };
}

async function withoutCookieWrites<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>
) {
  try {
    return await operation();
  } catch (error) {
    if (!isCookieMutationError(error)) {
      throw error;
    }

    return fallback();
  }
}

export async function getSession(
  ...args: Parameters<typeof auth.getSession>
) {
  return withoutCookieWrites(
    () => auth.getSession(...args),
    () =>
      readAuthEndpoint(
        ["get-session"],
        args[0] && typeof args[0] === "object" && "query" in args[0]
          ? (args[0].query as Record<string, unknown>)
          : undefined
      ) as ReturnType<typeof auth.getSession>
  );
}

export async function getAuthToken(
  ...args: Parameters<typeof auth.token>
) {
  return withoutCookieWrites(
    () => auth.token(...args),
    () => readAuthEndpoint(["token"]) as ReturnType<typeof auth.token>
  );
}

export async function listAccounts(
  ...args: Parameters<typeof auth.listAccounts>
) {
  return withoutCookieWrites(
    () => auth.listAccounts(...args),
    () =>
      readAuthEndpoint(["list-accounts"]) as ReturnType<
        typeof auth.listAccounts
      >
  );
}
