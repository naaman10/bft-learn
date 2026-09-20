"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { completeContent } from "@/app/learn/[contentId]/actions";

export function CompleteContentForm({
  contentId,
  itemId,
  children,
}: {
  contentId: string;
  itemId?: string;
  children: ReactNode;
}) {
  const [state, formAction] = useActionState(completeContent, null);

  return (
    <form action={formAction} className="contents">
      <div className="hidden">
        <input type="hidden" name="contentId" value={contentId} />
        {itemId ? <input type="hidden" name="itemId" value={itemId} /> : null}
      </div>
      {children}
      {state?.error ? (
        <p
          role="alert"
          className="rounded-2xl bg-error-bg px-4 py-3 text-sm text-error"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function CompleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(247,80,116,0.28)] hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Completing…" : "Complete"}
    </button>
  );
}
