"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveProgress } from "@/app/learn/[contentId]/actions";

export function AnswerTextarea({
  contentId,
  itemId,
  defaultValue,
}: {
  contentId: string;
  itemId: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValueRef = useRef(defaultValue);

  const debouncedSave = useCallback(
    async (answerText: string) => {
      if (answerText === lastSavedValueRef.current) {
        return;
      }

      setSaveStatus("saving");
      const result = await saveProgress(contentId, itemId, answerText);
      
      if (result.success) {
        lastSavedValueRef.current = answerText;
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [contentId, itemId]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      debouncedSave(newValue);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <label className="sr-only" htmlFor={`answer-${itemId}`}>
        Your answer
      </label>
      <textarea
        id={`answer-${itemId}`}
        name="answer"
        value={value}
        onChange={handleChange}
        rows={8}
        placeholder="Write your answer here…"
        className="mt-1 min-h-40 w-full resize-y rounded-[22px] border border-border bg-background px-4 py-3.5 text-left text-lg leading-relaxed text-foreground placeholder:text-stone-400 outline-none focus:border-accent focus:ring-2 focus:ring-ring"
      />
      {saveStatus !== "idle" && (
        <div className="mt-2 flex items-center gap-2">
          {saveStatus === "saving" && (
            <p className="text-sm text-muted">Saving...</p>
          )}
          {saveStatus === "saved" && (
            <p className="text-sm text-green-600">Saved ✓</p>
          )}
          {saveStatus === "error" && (
            <p className="text-sm text-error">Failed to save. Will retry.</p>
          )}
        </div>
      )}
    </div>
  );
}
