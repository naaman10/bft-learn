import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/learn",
    "/learn/((?!test-autosave).*)",
    "/auth/set-password",
  ],
};
