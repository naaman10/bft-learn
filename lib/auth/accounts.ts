import { auth } from "@/lib/auth/server";

type AccountLike = {
  providerId?: string;
};

function asAccountList(data: unknown): AccountLike[] {
  if (Array.isArray(data)) {
    return data as AccountLike[];
  }

  return [];
}

export async function hasCredentialAccount(): Promise<boolean> {
  const { data } = await auth.listAccounts();
  return asAccountList(data).some((account) => account.providerId === "credential");
}
