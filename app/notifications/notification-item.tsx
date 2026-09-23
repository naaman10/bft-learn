"use client";

import Link from "next/link";
import { useState } from "react";
import type { Notification } from "@/lib/api/learn";
import { markAsRead } from "./actions";

export function NotificationItem({
  notification,
  formattedDate,
}: {
  notification: Notification;
  formattedDate: string;
}) {
  const [isRead, setIsRead] = useState(notification.read);

  async function handleClick() {
    if (!isRead) {
      setIsRead(true);
      await markAsRead(notification.id);
    }
  }

  const content = (
    <article
      className={`flex gap-4 rounded-2xl border p-4 transition-colors ${
        isRead
          ? "border-border bg-card"
          : "border-accent/20 bg-card shadow-[var(--shadow-card)]"
      }`}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold leading-snug">{notification.title}</h3>
            <p className="mt-1 text-sm text-muted">{notification.message}</p>
            {notification.metadata?.contentName && (
              <p className="mt-2 text-sm font-medium text-foreground">
                {notification.metadata.contentName}
                {notification.metadata.contentType && (
                  <span className="ml-2 text-xs text-muted">
                    {notification.metadata.contentType}
                  </span>
                )}
              </p>
            )}
          </div>
          {!isRead && (
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
          )}
        </div>
        <p className="mt-2 text-xs text-muted">{formattedDate}</p>
      </div>
    </article>
  );

  if (notification.contentId) {
    return (
      <Link
        href={`/learn/${notification.contentId}`}
        onClick={handleClick}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-2xl"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-2xl"
    >
      {content}
    </button>
  );
}
