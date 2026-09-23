import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { ChevronLeftIcon } from "@/app/ui/icons";
import { getAuthToken, getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { GemHuntFrame } from "./gem-hunt-frame";

export const dynamic = "force-dynamic";

function gamesBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_GAMES_URL?.replace(/\/$/, "") ||
    "https://bft-games.vercel.app"
  );
}

function apiBaseUrl() {
  const url = process.env.API_URL?.replace(/\/$/, "");
  if (!url) {
    throw new Error("API_URL is not configured.");
  }
  return url;
}

export default async function GemHuntPage() {
  const { data: session } = await getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { data: tokenPayload } = await getAuthToken();
  const token =
    tokenPayload &&
    typeof tokenPayload === "object" &&
    "token" in tokenPayload &&
    typeof tokenPayload.token === "string"
      ? tokenPayload.token
      : null;

  if (!token) {
    return (
      <AppShell>
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-5 py-4 md:px-8 md:py-6">
          <section className="flex items-center gap-3">
            <Link
              href="/games"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-card"
              aria-label="Back to games"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Gem Hunt
            </h1>
          </section>
          <section className="rounded-[28px] bg-card p-8 text-center shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">Couldn’t start the game</h2>
            <p className="mt-2 text-muted">
              We couldn’t get your sign-in token. Try signing out and back in,
              then open Gem Hunt again.
            </p>
          </section>
        </main>
      </AppShell>
    );
  }

  const gameUrl = `${gamesBaseUrl()}/game/gem-hunt`;

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-5 py-4 md:px-8 md:py-6">
        <section className="flex items-center gap-3">
          <Link
            href="/games"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-card"
            aria-label="Back to games"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Gem Hunt
          </h1>
        </section>

        <section className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-[28px] bg-card shadow-[var(--shadow-card)]">
          <GemHuntFrame
            gameUrl={gameUrl}
            token={token}
            apiBaseUrl={apiBaseUrl()}
            username={session.user.name}
          />
        </section>
      </main>
    </AppShell>
  );
}
