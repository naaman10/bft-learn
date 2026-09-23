import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { ChevronLeftIcon, GamepadIcon } from "@/app/ui/icons";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const games = [
  {
    slug: "gem-hunt",
    name: "Gem Hunt",
    description: "Find the gems and complete the challenge.",
  },
] as const;

export default async function GamesPage() {
  const { data: session } = await getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-4 md:px-8 md:py-6">
        <section className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-card"
            aria-label="Back to dashboard"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Games
          </h1>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {games.map((game) => (
            <Link
              key={game.slug}
              href={`/games/${game.slug}`}
              className="block rounded-[28px] focus-visible:outline-none"
            >
              <article className="relative min-h-[12rem] overflow-hidden rounded-[28px] bg-mint p-5 shadow-[var(--shadow-card)]">
                <div className="relative flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/80 text-foreground">
                    <GamepadIcon className="h-6 w-6" />
                  </span>
                </div>
                <h2 className="relative mt-8 text-xl font-semibold leading-snug tracking-tight">
                  {game.name}
                </h2>
                <p className="relative mt-2 text-sm text-foreground/70">
                  {game.description}
                </p>
                <p className="relative mt-5 text-sm font-semibold text-foreground">
                  Play
                </p>
              </article>
            </Link>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
