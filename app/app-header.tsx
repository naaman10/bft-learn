import { signOut } from "@/app/dashboard/actions";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <img src="/bft-learn-logo.png" alt="BFT Learn Logo" className="h-8" />

      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted hover:bg-background"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
