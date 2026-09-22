import type { CourseSection } from "@/lib/api/learn";
import { InfoSection } from "@/app/learn/info-section";
import { QuestionTextSection } from "@/app/learn/question-text-section";

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
