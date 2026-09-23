import type { Assessment } from "@/lib/api/learn";

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

export function AssessmentItem({ assessment }: { assessment: Assessment }) {
  const pointsScored = typeof assessment.pointsScored === 'number' ? assessment.pointsScored : 0;
  const pointsAvailable = typeof assessment.pointsAvailable === 'number' ? assessment.pointsAvailable : 0;
  const name = assessment.enrollmentName || 'Assessment';
  
  const passPercentage =
    pointsAvailable > 0
      ? Math.round((pointsScored / pointsAvailable) * 100)
      : 0;
  const pct =
    pointsAvailable > 0
      ? Math.min(1, pointsScored / pointsAvailable)
      : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * pct;
  const completedDate = formatDate(assessment.completedAt);

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="relative grid shrink-0 place-items-center">
        <svg
          viewBox="0 0 100 100"
          className="h-16 w-16 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--accent-soft)"
            strokeWidth="12"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <span className="absolute flex flex-col items-center leading-none">
          <span className="text-base font-semibold tabular-nums">
            {pointsScored}
          </span>
          <span className="mt-0.5 text-[10px] font-medium text-muted">
            of {pointsAvailable}
          </span>
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold leading-snug truncate">
          {name}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted">
          <span className="font-medium">{passPercentage}%</span>
          {completedDate && (
            <>
              <span aria-hidden="true">•</span>
              <span>{completedDate}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
