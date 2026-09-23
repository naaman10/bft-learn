import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/app-shell";
import { getSession } from "@/lib/auth/session";
import { getAssessmentDetail } from "@/lib/api/learn";
import { ChevronRightIcon } from "@/app/ui/icons";
import { ProgressRing } from "@/app/ui/progress-ring";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-GB", { 
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { data: session } = await getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { assessmentId } = await params;
  const assessment = await getAssessmentDetail(assessmentId);

  if (!assessment) {
    return (
      <AppShell>
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-4 md:px-8 md:py-6">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Assessment not found
            </h1>
            <p className="mt-2 text-muted">
              This assessment doesn't exist or you don't have access to it.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover"
            >
              Back to dashboard
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  const percentage =
    assessment.totalPointsAvailable > 0
      ? Math.round(
          (assessment.totalPointsEarned / assessment.totalPointsAvailable) * 100
        )
      : 0;
  const completedDate = formatDate(assessment.assessmentDate);

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-4 md:px-8 md:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="text-foreground">Assessment Results</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {assessment.enrollmentName}
          </h1>
          {completedDate && (
            <p className="text-sm text-muted">Completed {completedDate}</p>
          )}
        </div>

        {/* Summary Section */}
        <section className="rounded-[28px] bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            Your Results
          </h2>
          
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            <div className="flex justify-center md:justify-start">
              <ProgressRing
                value={assessment.totalPointsEarned}
                max={Math.max(assessment.totalPointsAvailable, 1)}
                label={String(assessment.totalPointsEarned)}
                of={assessment.totalPointsAvailable}
                caption="Points"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-semibold tracking-tight">
                  {percentage}%
                </span>
                <span className="text-lg text-muted">
                  {assessment.totalPointsEarned} of {assessment.totalPointsAvailable} points
                </span>
              </div>

              {assessment.assessmentFeedback && (
                <div className="mt-6">
                  <h3 className="mb-2 font-semibold">Overall Feedback</h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {assessment.assessmentFeedback}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Questions Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Question Breakdown
          </h2>
          
          <div className="flex flex-col gap-3">
            {assessment.questions.map((question, index) => {
              const questionPercentage =
                question.pointsAvailable > 0
                  ? Math.round(
                      (question.pointsEarned / question.pointsAvailable) * 100
                    )
                  : 0;

              return (
                <div
                  key={question.questionId}
                  className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="mb-3 leading-relaxed">
                        {question.questionText}
                      </p>

                      {question.userAnswer && (
                        <div className="mb-3 rounded-lg bg-muted/30 p-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                            Your Answer
                          </p>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {question.userAnswer}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {question.pointsEarned} / {question.pointsAvailable}
                          </span>
                          <span className="text-muted">points</span>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            questionPercentage === 100
                              ? "bg-green-100 text-green-700"
                              : questionPercentage >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {questionPercentage}%
                        </span>
                      </div>

                      {question.feedback && (
                        <div className="mt-3 rounded-lg bg-accent-soft/30 p-3">
                          <p className="text-sm leading-relaxed">
                            <span className="font-semibold">Feedback: </span>
                            {question.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Back Button */}
        <div className="mt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
