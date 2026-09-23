import { signOut } from "@/app/dashboard/actions";
import { SignOutIcon, InboxIcon } from "@/app/ui/icons";

export function SignOutButton({
  variant = "text",
}: {
  variant?: "text" | "icon";
}) {
  if (variant === "icon") {
    return (
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Sign out"
          className="grid h-11 w-11 place-items-center rounded-full bg-card text-muted shadow-[var(--shadow-card)] hover:text-foreground"
        >
          <SignOutIcon className="h-5 w-5" />
        </button>
      </form>
    );
  }

  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted hover:bg-background hover:text-foreground"
      >
        Sign out
      </button>
    </form>
  );
}

export function InboxButton({
  notificationCount = 0,
}: {
  notificationCount?: number;
}) {
  return (
    <button
      type="button"
      aria-label={`Inbox${notificationCount > 0 ? ` (${notificationCount} new notifications)` : ""}`}
      className="relative grid h-11 w-11 place-items-center rounded-full bg-card text-muted shadow-[var(--shadow-card)] hover:text-foreground"
    >
      <InboxIcon className="h-5 w-5" />
      {notificationCount > 0 && (
        <span className="absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-white">
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>
      )}
    </button>
  );
}

export function DesktopBrandBar() {
  return (
    <header className="hidden md:block">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-8 py-5">
        <img src="/bft-learn-logo.png" alt="BFT Learn" className="h-8" />
        <div className="flex items-center gap-3">
          <InboxButton notificationCount={3} />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

export function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      aria-hidden="true"
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-white shadow-[0_8px_18px_rgba(247,80,116,0.28)]"
    >
      {initials || "B"}
    </div>
  );
}

export function firstName(name: string) {
  return name.trim().split(/\s+/).filter(Boolean)[0] || "there";
}
