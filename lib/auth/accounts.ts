import { listAccounts } from "@/lib/auth/session";

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
  const { data } = await listAccounts();
  return asAccountList(data).some((account) => account.providerId === "credential");
}
