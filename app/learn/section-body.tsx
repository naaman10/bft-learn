import type { CourseSection } from "@/lib/api/learn";
import { InfoSection } from "@/app/learn/info-section";
import { QuestionTextSection } from "@/app/learn/question-text-section";
import { QuestionMultipleChoiceSection } from "@/app/learn/question-multiple-choice-section";

function hasOptions(section: CourseSection): boolean {
  const options = section.fields.options ?? section.fields.choices;
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }
  return Array.isArray(options) && options.length > 0;
}

export function SectionBody({
  section,
  savedAnswer,
  variant = "task",
  contentId,
}: {
  section: CourseSection | null;
  savedAnswer?: unknown;
  variant?: "task" | "reference";
  contentId?: string;
}) {
  if (!section) {
    return <p className="text-muted">This section could not be found.</p>;
  }

  if (section.contentType === "infoSection") {
    return <InfoSection section={section} />;
  }

  if (section.contentType === "question") {
    if (hasOptions(section)) {
      return (
        <QuestionMultipleChoiceSection
          section={section}
          savedAnswer={savedAnswer}
          showAnswer={variant === "task"}
        />
      );
    }
    
    return (
      <QuestionTextSection
        section={section}
        savedAnswer={savedAnswer}
        showAnswer={variant === "task"}
        contentId={contentId}
      />
    );
  }

  return <p className="text-muted">This section type is not available yet.</p>;
}
