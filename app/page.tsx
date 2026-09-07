import { redirect } from "next/navigation";
import { redirectAuthenticatedUser } from "@/lib/auth/redirect";

export const dynamic = "force-dynamic";

export default async function Home() {
  await redirectAuthenticatedUser();
  redirect("/auth/sign-in");
}
