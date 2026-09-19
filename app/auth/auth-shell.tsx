import type { ReactNode } from "react";
import { EmptySparkle } from "@/app/ui/illustrations";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-full flex-1 flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <img
          src="/bft-learn-logo.png"
          alt="BFT Learn"
          className="mx-auto mb-6 h-10"
        />
        <div className="relative overflow-hidden rounded-[32px] bg-card p-7 shadow-[var(--shadow-card)] sm:p-8">
          <EmptySparkle className="pointer-events-none absolute -right-6 -top-8 h-24 w-32 opacity-80" />
          <h1 className="relative text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="relative mt-2 text-sm leading-relaxed text-muted">
              {subtitle}
            </p>
          ) : null}
          <div className="relative mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
