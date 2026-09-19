import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import type { Document } from "@contentful/rich-text-types";
import type { CourseSection } from "@/lib/api/learn";

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

export function QuestionTextSection({
  section,
  savedAnswer,
}: {
  section: CourseSection;
  savedAnswer?: unknown;
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
  const defaultAnswer =
    typeof savedAnswer === "string" ? savedAnswer : "";

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
      <label className="sr-only" htmlFor={`answer-${section.entryId ?? "question"}`}>
        Your answer
      </label>
      <textarea
        id={`answer-${section.entryId ?? "question"}`}
        name="answer"
        defaultValue={defaultAnswer}
        rows={8}
        placeholder="Write your answer here…"
        className="mt-1 min-h-40 w-full resize-y rounded-[22px] border border-border bg-background px-4 py-3.5 text-left text-lg leading-relaxed text-foreground placeholder:text-stone-400 outline-none focus:border-accent focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
