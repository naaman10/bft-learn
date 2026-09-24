"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import type { Document } from "@contentful/rich-text-types";
import type { CourseSection } from "@/lib/api/learn";
import { saveProgress } from "@/app/learn/[contentId]/actions";

function isDocument(value: unknown): value is Document {
  return Boolean(
    value &&
      typeof value === "object" &&
      "nodeType" in value &&
      value.nodeType === "document"
  );
}

function firstField(fields: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (isDocument(value)) {
      return value;
    }
  }

  return null;
}

function FieldText({
  value,
  className,
}: {
  value: string | Document;
  className: string;
}) {
  if (typeof value === "string") {
    return <p className={className}>{value}</p>;
  }

  return (
    <div className={className}>
      {documentToReactComponents(value, {
        renderNode: {
          [BLOCKS.PARAGRAPH]: (_node, children) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
        },
      })}
    </div>
  );
}

type MultipleChoiceOption = {
  id: string;
  text: string;
  imageUrl?: string;
};

function parseOptions(value: unknown): MultipleChoiceOption[] {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is MultipleChoiceOption =>
            typeof item === "object" &&
            item !== null &&
            typeof item.id === "string" &&
            typeof item.text === "string"
        );
      }
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is MultipleChoiceOption =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.text === "string"
    );
  }

  return [];
}

function OptionButton({
  option,
  isSelected,
  onSelect,
  disabled = false,
}: {
  option: MultipleChoiceOption;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`relative flex min-h-[120px] flex-col items-start justify-center rounded-2xl border-2 p-4 text-left transition-all hover:border-accent hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
        isSelected
          ? "border-accent bg-accent-soft/30 shadow-md"
          : "border-border bg-background"
      }`}
    >
      {option.imageUrl && (
        <div className="mb-3 w-full">
          <Image
            src={option.imageUrl}
            alt=""
            width={200}
            height={120}
            className="h-auto w-full rounded-lg object-cover"
          />
        </div>
      )}
      <span className="text-base leading-relaxed">{option.text}</span>
      <div
        className={`absolute right-3 top-3 h-5 w-5 rounded-full border-2 transition-all ${
          isSelected
            ? "border-accent bg-accent"
            : "border-border bg-background"
        }`}
      >
        {isSelected && (
          <svg
            className="h-full w-full text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

export function QuestionMultipleChoiceSection({
  section,
  savedAnswer,
  showAnswer = true,
  contentId,
}: {
  section: CourseSection;
  savedAnswer?: unknown;
  showAnswer?: boolean;
  contentId?: string;
}) {
  const question = firstField(section.fields, [
    "questionText",
    "question",
    "prompt",
    "text",
    "title",
  ]);
  const help = firstField(section.fields, [
    "questionHelp",
    "helpText",
    "help",
    "hint",
  ]);
  
  const optionsValue = section.fields.options ?? section.fields.choices;
  const options = parseOptions(optionsValue);

  const defaultSelectedId =
    typeof savedAnswer === "string" ? savedAnswer : "";
  const [selectedId, setSelectedId] = useState(defaultSelectedId);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleSelect = useCallback(
    async (optionId: string) => {
      setSelectedId(optionId);
      
      // Auto-save if contentId and itemId are available
      if (contentId && section.entryId) {
        setSaveStatus("saving");
        const result = await saveProgress(contentId, section.entryId, optionId);
        
        if (result.success) {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("error");
          setTimeout(() => setSaveStatus("idle"), 3000);
        }
      }
    },
    [contentId, section.entryId]
  );

  const hasAutoSave = Boolean(contentId && section.entryId);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {question ? (
        <FieldText
          value={question}
          className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl"
        />
      ) : (
        <p className="text-muted">This question has no text yet.</p>
      )}
      {help && (
        <FieldText
          value={help}
          className="rounded-2xl bg-accent-soft/70 px-4 py-3 text-sm text-foreground/80"
        />
      )}
      {showAnswer && options.length > 0 ? (
        <div className="mt-2">
          {/* Hidden input for form submission (when not using auto-save) */}
          {!hasAutoSave && <input type="hidden" name="answer" value={selectedId} />}
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {options.map((option) => (
              <OptionButton
                key={option.id}
                option={option}
                isSelected={selectedId === option.id}
                onSelect={() => handleSelect(option.id)}
                disabled={saveStatus === "saving"}
              />
            ))}
          </div>
          
          {/* Save status indicator for auto-save mode */}
          {hasAutoSave && saveStatus !== "idle" && (
            <div className="mt-2 flex items-center gap-2">
              {saveStatus === "saving" && (
                <p className="text-sm text-muted">Saving...</p>
              )}
              {saveStatus === "saved" && (
                <p className="text-sm text-green-600">Saved ✓</p>
              )}
              {saveStatus === "error" && (
                <p className="text-sm text-error">Failed to save. Try again.</p>
              )}
            </div>
          )}
        </div>
      ) : showAnswer ? (
        <p className="text-muted">No options available for this question.</p>
      ) : null}
    </div>
  );
}
