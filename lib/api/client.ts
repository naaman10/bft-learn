import { auth } from "@/lib/auth/server";

type TokenPayload = {
  token?: string;
};

function apiUrl(path: string) {
  const baseUrl = process.env.API_URL;

  if (!baseUrl) {
    throw new Error("API_URL is not configured.");
  }

  return new URL(path.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
}

async function getJwtToken() {
  const { data } = await auth.token();
  const payload = data as TokenPayload | null;

  return typeof payload?.token === "string" ? payload.token : null;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? `API request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Server-side fetch helper for the content API.
 * Attaches the Neon Auth JWT as a Bearer token.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getJwtToken();

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), {
    cache: "no-store",
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<T>;
}
