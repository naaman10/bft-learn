import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { hasCredentialAccount } from "@/lib/auth/accounts";
import {
  getCourseSections,
  getLearnContent,
  isSubmittedProgress,
  progressLabel,
} from "@/lib/api/learn";
import { AppHeader } from "@/app/app-header";
import {
  CompleteButton,
  CompleteContentForm,
} from "@/app/learn/complete-content-form";
import { InfoSection } from "@/app/learn/info-section";
import { QuestionTextSection } from "@/app/learn/question-text-section";

export const dynamic = "force-dynamic";

function contentErrorMessage(status: number) {
  switch (status) {
    case 403:
      return "You are not enrolled in this course.";
    case 404:
      return "This course could not be found.";
    case 503:
      return "The learning service is unavailable. Try again later.";
    default:
      return "This course could not be loaded.";
  }
}

export default async function LearnSectionPage({
  params,
}: {
  params: Promise<{ contentId: string; sectionIndex: string }>;
}) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  if (!(await hasCredentialAccount())) {
    redirect("/auth/set-password");
  }

  const { contentId, sectionIndex: sectionIndexParam } = await params;
  const result = await getLearnContent(contentId);

  if (!result.ok && result.status === 401) {
    redirect("/auth/sign-in");
  }

  const sections = result.ok ? getCourseSections(result.data) : [];
  const sectionIndex = Number.parseInt(sectionIndexParam, 10);
  const sectionValid =
    Number.isInteger(sectionIndex) &&
    sectionIndex >= 0 &&
    sectionIndex < sections.length;
  const section = sectionValid ? sections[sectionIndex] : null;
  const isLastSection =
    sectionValid && sections.length > 0 && sectionIndex === sections.length - 1;
  const submitted = result.ok && isSubmittedProgress(result.data.progressStatus);
  const canComplete = Boolean(isLastSection && !submitted);

  const sectionCard = (
    <div className="flex flex-1 flex-col rounded-2xl border border-border bg-card p-8 shadow-sm">
      {!section ? (
        <p className="text-muted">This section could not be found.</p>
      ) : section.contentType === "infoSection" ? (
        <InfoSection section={section} />
      ) : section.contentType === "question" ? (
        <QuestionTextSection
          section={section}
          savedAnswer={
            section.entryId && result.ok
              ? result.data.progress.items[section.entryId]?.answer
              : undefined
          }
        />
      ) : (
        <p className="text-muted">This section type is not available yet.</p>
      )}
    </div>
  );

  const sectionNav =
    sections.length > 0 ? (
      <nav className="flex items-center justify-between gap-4">
        {sectionValid && sectionIndex > 0 ? (
          <Link
            href={`/learn/${contentId}/${sectionIndex - 1}`}
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            Previous
          </Link>
        ) : (
          <span />
        )}
        <p className="text-sm text-muted">
          {sectionValid ? sectionIndex + 1 : 0} of {sections.length}
        </p>
        {sectionValid && sectionIndex < sections.length - 1 ? (
          <Link
            href={`/learn/${contentId}/${sectionIndex + 1}`}
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            Next
          </Link>
        ) : canComplete ? (
          <CompleteButton />
        ) : isLastSection && submitted ? (
          <span className="text-sm font-medium text-muted">Completed</span>
        ) : (
          <span />
        )}
      </nav>
    ) : null;

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <Link
          href="/dashboard"
          className="self-start text-sm font-medium text-accent hover:text-accent-hover"
        >
          Back to dashboard
        </Link>

        {!result.ok ? (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">
              Unable to open course
            </h1>
            <p className="mt-2 text-muted">
              {contentErrorMessage(result.status)}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {result.data.content.name.trim() ||
                    result.data.content.entryName.trim() ||
                    "Assigned work"}
                </h1>
                <span className="shrink-0 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted capitalize">
                  {progressLabel(result.data.progressStatus)}
                </span>
              </div>
              <p className="text-sm text-muted">
                {[
                  result.data.content.type,
                  result.data.content.subject,
                  result.data.content.ageGroup,
                  result.data.content.stage,
                ]
                  .filter((value) => value?.trim())
                  .join(" · ")}
              </p>
            </div>

            {canComplete ? (
              <CompleteContentForm
                contentId={contentId}
                itemId={section?.entryId}
              >
                {sectionCard}
                {sectionNav}
              </CompleteContentForm>
            ) : (
              <>
                {sectionCard}
                {sectionNav}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
