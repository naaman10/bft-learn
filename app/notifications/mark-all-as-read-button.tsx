"use client";

import { useState } from "react";
import { markAllAsRead } from "./actions";

export function MarkAllAsReadButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    await markAllAsRead();
    setIsLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted hover:bg-background hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Marking..." : "Mark all as read"}
    </button>
  );
}
