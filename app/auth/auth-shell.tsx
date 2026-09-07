import type { ReactNode } from "react";

export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="mb-2 text-center text-sm font-semibold tracking-wide text-accent uppercase">
          BFT Learn
        </p>
        <h1 className="mb-8 text-center text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}
