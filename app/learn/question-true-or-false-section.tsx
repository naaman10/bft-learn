"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import type { Document } from "@contentful/rich-text-types";
import type { CourseSection } from "@/lib/api/learn";
import { saveProgress } from "@/app/learn/[contentId]/actions";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

const CHOICES = ["True", "False"] as const;

type TrueFalseChoice = (typeof CHOICES)[number];

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

function absoluteUrl(url: string) {
  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  return url;
}

function imageFromField(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return {
      src: absoluteUrl(value.trim()),
      alt: "",
      width: 1200,
      height: 800,
    };
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const fields = asRecord(record.fields) ?? record;
  const file = asRecord(fields.file);
  const rawUrl =
    (typeof fields.url === "string" && fields.url) ||
    (typeof file?.url === "string" && file.url);

  if (!rawUrl) {
    return null;
  }

  const details = asRecord(file?.details);
  const image = asRecord(details?.image);
  const width = typeof image?.width === "number" ? image.width : 1200;
  const height = typeof image?.height === "number" ? image.height : 800;
  const alt =
    (typeof fields.description === "string" && fields.description) ||
    (typeof fields.title === "string" && fields.title) ||
    "";

  return { src: absoluteUrl(rawUrl), alt, width, height };
}

function savedChoice(value: unknown): TrueFalseChoice | "" {
  if (value === true || value === "True" || value === "true") {
    return "True";
  }
  if (value === false || value === "False" || value === "false") {
    return "False";
  }

  return "";
}

function ChoiceButton({
  label,
  isSelected,
  onSelect,
  disabled = false,
}: {
  label: TrueFalseChoice;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      disabled={disabled}
      className={`relative flex min-h-24 items-center justify-center rounded-2xl border-2 px-4 py-5 text-lg font-semibold transition-all hover:border-accent hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${
        isSelected
          ? "border-accent bg-accent-soft/30 shadow-md"
          : "border-border bg-background"
      }`}
    >
      {label}
      <span
        className={`absolute right-3 top-3 h-5 w-5 rounded-full border-2 transition-all ${
          isSelected ? "border-accent bg-accent" : "border-border bg-background"
        }`}
      >
        {isSelected ? (
          <svg
            className="h-full w-full text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : null}
      </span>
    </button>
  );
}

export function QuestionTrueOrFalseSection({
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
  const image = imageFromField(section.fields.questionImage);
  const [selected, setSelected] = useState<TrueFalseChoice | "">(
    savedChoice(savedAnswer)
  );
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const handleSelect = useCallback(
    async (choice: TrueFalseChoice) => {
      setSelected(choice);

      if (contentId && section.entryId) {
        setSaveStatus("saving");
        const result = await saveProgress(contentId, section.entryId, choice);

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
      {help ? (
        <FieldText
          value={help}
          className="rounded-2xl bg-accent-soft/70 px-4 py-3 text-sm text-foreground/80"
        />
      ) : null}
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="h-auto max-w-full rounded-2xl"
        />
      ) : null}
      {showAnswer ? (
        <div className="mt-2">
          {!hasAutoSave ? (
            <input type="hidden" name="answer" value={selected} />
          ) : null}
          <div
            role="radiogroup"
            aria-label="True or false"
            className="grid grid-cols-2 gap-3"
          >
            {CHOICES.map((choice) => (
              <ChoiceButton
                key={choice}
                label={choice}
                isSelected={selected === choice}
                onSelect={() => handleSelect(choice)}
                disabled={saveStatus === "saving"}
              />
            ))}
          </div>
          {hasAutoSave && saveStatus !== "idle" ? (
            <div className="mt-2 flex items-center gap-2">
              {saveStatus === "saving" ? (
                <p className="text-sm text-muted">Saving...</p>
              ) : null}
              {saveStatus === "saved" ? (
                <p className="text-sm text-green-600">Saved ✓</p>
              ) : null}
              {saveStatus === "error" ? (
                <p className="text-sm text-error">Failed to save. Try again.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
