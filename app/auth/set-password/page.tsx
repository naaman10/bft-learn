import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { hasCredentialAccount } from "@/lib/auth/accounts";
import { AuthShell } from "@/app/auth/auth-shell";
import { SetPasswordForm } from "./set-password-form";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  if (await hasCredentialAccount()) {
    redirect("/dashboard");
  }

  return (
    <AuthShell title="Set your password">
      <SetPasswordForm email={session.user.email} />
    </AuthShell>
  );
}
