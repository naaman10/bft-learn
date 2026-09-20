import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasCredentialAccount } from "@/lib/auth/accounts";
import {
  getCourseSections,
  getLearnContent,
  isSubmittedProgress,
} from "@/lib/api/learn";
import { ChevronLeftIcon, ChevronRightIcon } from "@/app/ui/icons";
import {
  CompleteButton,
  CompleteContentForm,
} from "@/app/learn/complete-content-form";
import { SectionBody } from "@/app/learn/section-body";

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
  const { data: session } = await getSession();

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
    <div className="flex h-full min-h-0 min-h-[18rem] flex-1 flex-col rounded-[28px] bg-card p-5 shadow-[var(--shadow-card)] sm:p-8">
      <SectionBody
        section={section}
        savedAnswer={
          section?.entryId && result.ok
            ? result.data.progress.items[section.entryId]?.answer
            : undefined
        }
      />
    </div>
  );

  const sectionNav =
    sections.length > 0 ? (
      <nav className="fixed inset-x-0 bottom-0 z-20 px-5 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-2 md:static md:px-0 md:pb-0 md:pt-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full bg-card/95 p-1.5 shadow-[0_12px_40px_rgba(28,25,23,0.12)] ring-1 ring-border backdrop-blur md:max-w-none md:bg-transparent md:p-0 md:shadow-none md:ring-0 md:backdrop-blur-none">
          {sectionValid && sectionIndex > 0 ? (
            <Link
              href={`/learn/${contentId}/${sectionIndex - 1}`}
              className="inline-flex min-h-12 items-center gap-1 rounded-full bg-background px-4 text-sm font-semibold text-foreground hover:bg-white md:bg-card md:shadow-[var(--shadow-card)] md:ring-1 md:ring-border"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Back
            </Link>
          ) : (
            <span className="min-h-12 min-w-12" />
          )}
          <p className="text-sm font-medium text-muted">
            {sectionValid ? sectionIndex + 1 : 0} of {sections.length}
          </p>
          {sectionValid && sectionIndex < sections.length - 1 ? (
            <Link
              href={`/learn/${contentId}/${sectionIndex + 1}`}
              className="inline-flex min-h-12 items-center gap-1 rounded-full bg-accent px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(247,80,116,0.28)] hover:bg-accent-hover"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          ) : canComplete ? (
            <CompleteButton />
          ) : isLastSection && submitted ? (
            <span className="rounded-full bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
              All done
            </span>
          ) : (
            <span className="min-h-12 min-w-12" />
          )}
        </div>
      </nav>
    ) : null;

  return (
    <main className="flex h-full min-h-0 w-full flex-1 flex-col gap-5">
      {!result.ok ? (
        <div className="rounded-[28px] bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-muted">{contentErrorMessage(result.status)}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Back to home
          </Link>
        </div>
      ) : canComplete ? (
        <CompleteContentForm contentId={contentId} itemId={section?.entryId}>
          {sectionCard}
          {sectionNav}
        </CompleteContentForm>
      ) : (
        <>
          {sectionCard}
          {sectionNav}
        </>
      )}
    </main>
  );
}
