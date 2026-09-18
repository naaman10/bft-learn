import { proxyNeonAuthRequest } from "@/lib/auth/neon-proxy";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handler(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyNeonAuthRequest(request, path);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
