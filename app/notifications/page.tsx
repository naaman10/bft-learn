import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { ChevronLeftIcon } from "@/app/ui/icons";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getNotifications } from "@/lib/api/learn";
import { NotificationItem } from "./notification-item";
import { MarkAllAsReadButton } from "./mark-all-as-read-button";

export const dynamic = "force-dynamic";

function formatNotificationDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

export default async function NotificationsPage() {
  const { data: session } = await getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const notificationsData = await getNotifications({
    limit: 50,
    offset: 0,
  });

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = notificationsData?.unread ?? 0;

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-4 md:px-8 md:py-6">
        <section className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-card"
              aria-label="Back to dashboard"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted">
                  {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && <MarkAllAsReadButton />}
        </section>

        {notifications.length === 0 ? (
          <section className="flex flex-1 flex-col items-center justify-center rounded-[32px] bg-card px-6 py-14 text-center shadow-[var(--shadow-card)]">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-background">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-muted"
              >
                <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              No notifications yet
            </h2>
            <p className="mt-2 max-w-sm text-muted">
              When you receive notifications about assignments and updates, they'll appear here.
            </p>
          </section>
        ) : (
          <section className="flex flex-col gap-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                formattedDate={formatNotificationDate(notification.createdAt)}
              />
            ))}
          </section>
        )}
      </main>
    </AppShell>
  );
}
