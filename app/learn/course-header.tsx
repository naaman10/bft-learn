import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/app/ui/icons";

function CircleLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-card text-foreground shadow-[var(--shadow-card)] ring-1 ring-border hover:bg-background"
    >
      {children}
    </Link>
  );
}

export function CourseHeader({
  title,
  progressLabel,
  tags,
  progressPercent,
  showProgress,
}: {
  title: string;
  progressLabel?: string | null;
  tags: string[];
  progressPercent: number;
  showProgress: boolean;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-5">
      <div className="flex items-center gap-3">
        <CircleLink href="/dashboard" label="Back to home">
          <ChevronLeftIcon className="h-5 w-5" />
        </CircleLink>
        <h1 className="min-w-0 flex-1 text-lg font-semibold leading-snug tracking-tight md:text-xl">
          {title}
        </h1>
      </div>

      {progressLabel ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
              {progressLabel}
            </span>
            {tags.map((value) => (
              <span
                key={value}
                className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted shadow-[var(--shadow-card)]"
              >
                {value}
              </span>
            ))}
          </div>
          {showProgress ? (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Learning progress</span>
                <span className="text-muted">{progressPercent}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-accent-soft">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
