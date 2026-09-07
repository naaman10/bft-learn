import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { hasCredentialAccount } from "@/lib/auth/accounts";
import { getLearnUser, progressLabel, type Enrollment } from "@/lib/api/learn";
import { AppHeader } from "@/app/app-header";

export const dynamic = "force-dynamic";

function enrolledDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const assignedOn = enrolledDate(enrollment.enrolledAt);
  const actionLabel =
    enrollment.progressStatus === "not_started" ? "Start" : "Continue";

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          {enrollment.name.trim() || "Assigned work"}
        </h2>
        <span className="shrink-0 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted capitalize">
          {progressLabel(enrollment.progressStatus)}
        </span>
      </div>
      {assignedOn && (
        <p className="text-sm text-muted">Assigned {assignedOn}</p>
      )}
      {enrollment.contentId && (
        <Link
          href={`/learn/${enrollment.contentId}`}
          className="mt-auto flex w-full justify-center rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          {actionLabel}
        </Link>
      )}
    </article>
  );
}

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  if (!(await hasCredentialAccount())) {
    redirect("/auth/set-password");
  }

  const learnUser = await getLearnUser();
  const enrollments = learnUser?.enrollments ?? [];

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader />

      {enrollments.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to BFT Learn {session.user.name}
          </h1>
          <p>When your tutor assigns you work, it will appear here.</p>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
          <h1 className="text-2xl font-semibold tracking-tight">Your work</h1>
          <div className="grid gap-4 sm:grid-cols-2">
            {enrollments.map((enrollment, index) => (
              <EnrollmentCard
                key={`${enrollment.contentId || enrollment.enrolledAt}-${index}`}
                enrollment={enrollment}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
