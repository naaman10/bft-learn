import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { InitialsAvatar, SignOutButton, firstName } from "@/app/app-header";
import { ArrowUpRightIcon, ChevronRightIcon } from "@/app/ui/icons";
import { CourseDoodle, EmptySparkle, HeroSparkle } from "@/app/ui/illustrations";
import { ProgressRing } from "@/app/ui/progress-ring";
import { getSession } from "@/lib/auth/session";
import { hasCredentialAccount } from "@/lib/auth/accounts";
import {
  getLearnUser,
  isSubmittedProgress,
  kidProgressLabel,
  type Enrollment,
} from "@/lib/api/learn";
import { redirect } from "next/navigation";
import { AssessmentItem } from "@/app/dashboard/assessment-item";

export const dynamic = "force-dynamic";

const palettes = [
  "bg-[#ffe4ec]",
  "bg-peach",
  "bg-lavender",
  "bg-mint",
] as const;

function enrolledDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

function actionCopy(status: string) {
  if (status === "not_started") {
    return "Let's go";
  }

  if (isSubmittedProgress(status)) {
    return "Have a look";
  }

  return "Keep going";
}

function continueHref(enrollments: Enrollment[]) {
  const inProgress = enrollments.find(
    (enrollment) =>
      enrollment.contentId && enrollment.progressStatus === "in_progress"
  );
  const notStarted = enrollments.find(
    (enrollment) =>
      enrollment.contentId && enrollment.progressStatus === "not_started"
  );
  const first = enrollments.find((enrollment) => enrollment.contentId);

  const pick = inProgress ?? notStarted ?? first;
  return pick?.contentId ? `/learn/${pick.contentId}` : undefined;
}

function EnrollmentCard({
  enrollment,
  index,
}: {
  enrollment: Enrollment;
  index: number;
}) {
  const assignedOn = enrolledDate(enrollment.enrolledAt);
  const href = enrollment.contentId
    ? `/learn/${enrollment.contentId}`
    : undefined;

  const card = (
    <article
      className={`relative min-h-[12rem] overflow-hidden rounded-[28px] p-5 shadow-[var(--shadow-card)] ${palettes[index % palettes.length]}`}
    >
      <div className="pointer-events-none absolute -bottom-3 -right-2 h-32 w-40">
        <CourseDoodle index={index} />
      </div>
      <div className="relative flex items-start justify-between gap-3">
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-foreground/80">
          {kidProgressLabel(enrollment.progressStatus)}
        </span>
        {href ? (
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-foreground shadow-sm">
            <ArrowUpRightIcon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <h2 className="relative mt-8 max-w-[70%] text-xl font-semibold leading-snug tracking-tight">
        {enrollment.name.trim() || "Assigned work"}
      </h2>
      {assignedOn ? (
        <p className="relative mt-2 max-w-[70%] text-sm text-foreground/70">
          Assigned {assignedOn}
        </p>
      ) : null}
      {href ? (
        <p className="relative mt-5 max-w-[70%] text-sm font-semibold text-foreground">
          {actionCopy(enrollment.progressStatus)}
        </p>
      ) : null}
    </article>
  );

  if (!href) {
    return card;
  }

  return (
    <Link href={href} className="block rounded-[28px] focus-visible:outline-none">
      {card}
    </Link>
  );
}

export default async function DashboardPage() {
  const { data: session } = await getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  if (!(await hasCredentialAccount())) {
    redirect("/auth/set-password");
  }

  const learnUser = await getLearnUser();
  const enrollments = learnUser?.enrollments ?? [];
  const assessments = learnUser?.assessments ?? [];
  const totalPoints =
    typeof learnUser?.totalPoints === "number" ? learnUser.totalPoints : 0;
  const targetPoints =
    typeof learnUser?.targetPoints === "number" ? learnUser.targetPoints : 0;
  const name = session.user.name || "there";
  const done = enrollments.filter((enrollment) =>
    isSubmittedProgress(enrollment.progressStatus)
  ).length;
  const remaining = Math.max(enrollments.length - done, 0);
  const percent =
    enrollments.length === 0
      ? 0
      : Math.round((done / enrollments.length) * 100);
  const learnHref = continueHref(enrollments);
  const hero =
    remaining === 0 && enrollments.length > 0
      ? {
          title: "You superstar!",
          body: "You've finished everything for now. Have a look back if you want a recap.",
          cta: learnHref ? "Have a look" : null,
        }
      : enrollments.some((item) => item.progressStatus === "in_progress")
        ? {
            title: "You're on a roll",
            body: "Jump back in and keep the streak going. One more section at a time.",
            cta: learnHref ? "Keep going" : null,
          }
        : {
            title: "Ready for a challenge?",
            body: "Your tutor has set some work. Pick a card and have a go.",
            cta: learnHref ? "Let's go" : null,
          };

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-4 md:px-8 md:py-2">
        <section className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <InitialsAvatar name={name} />
            <div>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                Hello, {firstName(name)}
              </h1>
              <p className="text-sm text-muted">
                {enrollments.length === 0
                  ? "Your learning space is ready"
                  : `${percent}% complete`}
              </p>
            </div>
          </div>
          <div className="md:hidden">
            <SignOutButton variant="icon" />
          </div>
        </section>

        <section className="hero-banner relative overflow-hidden rounded-[32px] p-6 shadow-[var(--shadow-card)] md:p-8">
          <div className="relative z-10 max-w-md">
            <h2 className="text-2xl font-semibold tracking-tight">
              {hero.title}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted md:text-base">
              {hero.body}
            </p>
            {hero.cta && learnHref ? (
              <Link
                href={learnHref}
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                {hero.cta}
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
          <HeroSparkle className="pointer-events-none absolute -right-2 bottom-0 h-28 w-36 sm:h-32 sm:w-40 md:right-6 md:h-44 md:w-56" />
        </section>

        {enrollments.length === 0 ? (
          <section className="flex flex-1 flex-col items-center justify-center rounded-[32px] bg-card px-6 py-14 text-center shadow-[var(--shadow-card)]">
            <EmptySparkle className="h-28 w-36" />
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              Nothing to do just yet
            </h2>
            <p className="mt-2 max-w-sm text-muted">
              When your tutor assigns you work, it will pop up here.
            </p>
          </section>
        ) : (
          <>
            <section>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-lg font-semibold tracking-tight">
                  Learning stats
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-3 md:max-w-xl">
                <ProgressRing
                  value={enrollments.length}
                  max={Math.max(enrollments.length, 1)}
                  label={String(enrollments.length)}
                  caption={enrollments.length === 1 ? "Course" : "Courses"}
                />
                <ProgressRing
                  value={done}
                  max={Math.max(enrollments.length, 1)}
                  label={String(done)}
                  caption="Finished"
                />
                <ProgressRing
                  value={totalPoints}
                  max={Math.max(targetPoints, 1)}
                  label={String(totalPoints)}
                  of={targetPoints > 0 ? targetPoints : undefined}
                  caption={totalPoints === 1 ? "Point" : "Points"}
                />
              </div>
            </section>

            {assessments.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Assessments
                  </h2>
                  <p className="text-sm text-muted">
                    {assessments.length} {assessments.length === 1 ? "assessment" : "assessments"}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {assessments.map((assessment) => (
                    <AssessmentItem key={assessment.id} assessment={assessment} />
                  ))}
                </div>
              </section>
            )}

            <section className="flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <h2 className="text-lg font-semibold tracking-tight">
                  My work
                </h2>
                <p className="text-sm text-muted">
                  {remaining === 0
                    ? "All done"
                    : `${remaining} to go`}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {enrollments.map((enrollment, index) => (
                  <EnrollmentCard
                    key={`${enrollment.contentId || enrollment.enrolledAt}-${index}`}
                    enrollment={enrollment}
                    index={index}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}
