import { redirectAuthenticatedUser } from "@/lib/auth/redirect";
import { AuthShell } from "@/app/auth/auth-shell";
import { MagicLinkCompleter } from "./magic-link-completer";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ neon_auth_session_verifier?: string | string[] }>;
}) {
  const params = await searchParams;
  const verifier = firstQueryValue(params.neon_auth_session_verifier);

  if (verifier) {
    return (
      <AuthShell title="Sign in to your account">
        <MagicLinkCompleter verifier={verifier} />
      </AuthShell>
    );
  }

  await redirectAuthenticatedUser();

  return (
    <AuthShell title="Sign in to your account">
      <SignInForm />
    </AuthShell>
  );
}
