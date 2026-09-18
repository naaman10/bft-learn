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
    <form action={formAction} className="flex flex-1 flex-col gap-6">
      <input type="hidden" name="contentId" value={contentId} />
      {itemId ? <input type="hidden" name="itemId" value={itemId} /> : null}
      {children}
      {state?.error ? (
        <p
          role="alert"
          className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error"
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
      className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Completing…" : "Complete"}
    </button>
  );
}
