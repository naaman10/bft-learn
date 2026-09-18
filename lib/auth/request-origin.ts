/**
 * Public origin of the incoming browser request.
 * Never includes a trailing slash — Neon Auth matches origins exactly.
 */
export function requestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== "null") {
    return origin.replace(/\/$/, "");
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // Fall through to forwarded host.
    }
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return "";
  }

  return `${proto}://${host.split(",")[0].trim()}`;
}
