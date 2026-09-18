import http from "node:http";
import https from "node:https";
import { requestOrigin } from "@/lib/auth/request-origin";

const FORWARD_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "cookie",
  "user-agent",
] as const;

const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "date",
  "set-auth-jwt",
  "set-auth-token",
  "x-neon-ret-request-id",
] as const;

function upstreamUrl(path: string[], requestUrl: string) {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEON_AUTH_BASE_URL is not configured.");
  }

  const url = new URL(
    `${baseUrl.replace(/\/$/, "")}/${path.map(encodeURIComponent).join("/")}`
  );
  url.search = new URL(requestUrl).search;
  return url;
}

function requestHeaders(request: Request, origin: string, bodyLength: number) {
  const headers: Record<string, string> = {
    origin,
    "x-neon-auth-middleware": "true",
  };

  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers[name] = value;
    }
  }

  if (bodyLength > 0) {
    headers["content-length"] = String(bodyLength);
  }

  return headers;
}

function proxyRequest(
  url: URL,
  method: string,
  headers: Record<string, string>,
  body?: Buffer
) {
  const client = url.protocol === "http:" ? http : https;

  return new Promise<http.IncomingMessage>((resolve, reject) => {
    const req = client.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method,
        headers,
      },
      resolve
    );

    req.on("error", reject);

    if (body && body.length > 0) {
      req.write(body);
    }

    req.end();
  });
}

async function readIncomingBody(response: http.IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of response) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function responseHeaders(response: http.IncomingMessage) {
  const headers = new Headers();

  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = response.headers[name];
    if (typeof value === "string") {
      headers.set(name, value);
    }
  }

  const setCookie = response.headers["set-cookie"];
  if (setCookie) {
    for (const cookie of setCookie) {
      headers.append("Set-Cookie", cookie);
    }
  }

  return headers;
}

/**
 * Proxies an auth request to Neon Auth with Node's HTTP client.
 *
 * Next.js `fetch()` always adds `sec-fetch-mode: cors`. Neon Auth treats that
 * header as an invalid origin and returns 403, even when the app domain is
 * allowlisted. See https://github.com/neondatabase/neon-js/issues/66
 */
export async function proxyNeonAuthRequest(
  request: Request,
  path: string[]
): Promise<Response> {
  const origin = requestOrigin(request);
  const url = upstreamUrl(path, request.url);
  const rawBody =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : Buffer.from(await request.arrayBuffer());
  const body = rawBody && rawBody.length > 0 ? rawBody : undefined;

  const upstream = await proxyRequest(
    url,
    request.method,
    requestHeaders(request, origin, body?.length ?? 0),
    body
  );
  const responseBody = await readIncomingBody(upstream);
  const status = upstream.statusCode ?? 502;

  if (status === 403) {
    console.error("[auth-proxy] Neon Auth rejected the request", {
      path: path.join("/"),
      origin,
      status,
    });
  }

  return new Response(responseBody, {
    status,
    headers: responseHeaders(upstream),
  });
}
