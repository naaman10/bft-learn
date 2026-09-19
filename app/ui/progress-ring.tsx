export function ProgressRing({
  value,
  max,
  label,
  caption,
}: {
  value: number;
  max: number;
  label: string;
  caption: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(1, value / max);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * pct;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center rounded-[28px] bg-card px-4 py-5 shadow-[var(--shadow-card)]">
      <div className="relative grid place-items-center">
        <svg
          viewBox="0 0 100 100"
          className="h-[5.5rem] w-[5.5rem] -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--accent-soft)"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <span
          className={`absolute font-semibold tabular-nums ${
            label.length > 3 ? "text-base" : "text-xl"
          }`}
        >
          {label}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-muted">{caption}</p>
    </div>
  );
}
