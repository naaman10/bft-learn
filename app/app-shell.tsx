import type { ReactNode } from "react";
import Link from "next/link";
import { DesktopBrandBar } from "@/app/app-header";
import { BookIcon, HomeIcon } from "@/app/ui/icons";

export function AppShell({
  children,
  current,
  learnHref,
}: {
  children: ReactNode;
  current: "home" | "learn";
  learnHref?: string;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <DesktopBrandBar />
      <div
        className={
          current === "home"
            ? "flex flex-1 flex-col pb-[5.75rem] md:pb-8"
            : "flex flex-1 flex-col"
        }
      >
        {children}
      </div>
      {current === "home" ? <MobileDock learnHref={learnHref} /> : null}
    </div>
  );
}

function MobileDock({ learnHref }: { learnHref?: string }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 px-5 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
    >
      <div className="mx-auto flex max-w-sm items-center justify-center gap-2 rounded-full bg-card/95 p-1.5 shadow-[0_12px_40px_rgba(28,25,23,0.12)] ring-1 ring-border backdrop-blur">
        <Link
          href="/dashboard"
          aria-current="page"
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white"
        >
          <HomeIcon className="h-5 w-5" />
          Home
        </Link>
        {learnHref ? (
          <Link
            href={learnHref}
            className="grid h-12 w-12 place-items-center rounded-full text-muted hover:bg-background hover:text-foreground"
            aria-label="Continue learning"
          >
            <BookIcon className="h-5 w-5" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
