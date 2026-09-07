import { auth } from "@/lib/auth/server";
import { hasCredentialAccount } from "@/lib/auth/accounts";
import { redirect } from "next/navigation";

export async function redirectAuthenticatedUser() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return;
  }

  if (await hasCredentialAccount()) {
    redirect("/dashboard");
  }

  redirect("/auth/set-password");
}
