export function HeroSparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 140"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="118" cy="70" r="46" fill="#fff" fillOpacity="0.55" />
      <path
        d="M96 78c8-28 36-40 52-28 10 8 8 28-8 40-22 16-52 8-44-12Z"
        fill="#f75074"
      />
      <path
        d="M86 46c6-3 12 4 8 10-5 7-16 4-14-4 1-3 3-5 6-6Z"
        fill="#f75074"
      />
      <path
        d="M128 28c7-4 14 4 10 11-5 8-18 5-16-5 1-3 3-5 6-6Z"
        fill="#fbb6c5"
      />
      <path
        d="M154 58c6-2 10 6 5 11-6 6-16 1-13-7 1-2 4-4 8-4Z"
        fill="#f75074"
        fillOpacity="0.7"
      />
      <path
        d="M70 64c8-2 10 10 2 14-8 3-14-7-8-12 2-1 4-2 6-2Z"
        fill="#fff3d1"
      />
      <path
        d="M108 54c10-18 38-18 44 2"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptySparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="80" cy="62" r="38" fill="#fde8ee" />
      <path
        d="M58 70c6-22 28-32 42-22 9 7 7 24-7 33-19 13-43 6-35-11Z"
        fill="#f75074"
      />
      <path
        d="M52 44c5-2 9 3 6 8-4 6-13 3-11-3 1-3 3-4 5-5Z"
        fill="#f75074"
      />
      <path
        d="M92 28c6-3 11 4 8 9-4 7-15 4-13-4 1-2 3-4 5-5Z"
        fill="#fbb6c5"
      />
      <path
        d="M114 50c5-2 8 5 4 9-5 5-13 1-11-6 1-2 4-3 7-3Z"
        fill="#f75074"
        fillOpacity="0.75"
      />
    </svg>
  );
}

const doodles = [
  function Books() {
    return (
      <>
        <rect x="78" y="38" width="34" height="46" rx="6" fill="#fff" fillOpacity="0.7" />
        <rect x="86" y="30" width="34" height="46" rx="6" fill="#f75074" />
        <rect x="94" y="44" width="18" height="4" rx="2" fill="#fff" fillOpacity="0.8" />
        <circle cx="132" cy="28" r="6" fill="#fff" fillOpacity="0.7" />
      </>
    );
  },
  function Rocket() {
    return (
      <>
        <path d="M108 78c8-22 22-36 28-38-2 8-8 26-22 40l-6-2Z" fill="#f75074" />
        <circle cx="124" cy="48" r="6" fill="#fff" fillOpacity="0.85" />
        <path d="M104 70l-10 4 8 10 8-8z" fill="#fbb6c5" />
        <circle cx="90" cy="34" r="5" fill="#fff" fillOpacity="0.65" />
      </>
    );
  },
  function Stars() {
    return (
      <>
        <path
          d="M112 28 118 42l15 1-12 10 4 14-13-8-13 8 4-14-12-10 15-1z"
          fill="#f75074"
        />
        <path
          d="M86 52 90 60l9 .6-7 6 2.4 8.4-7.4-4.8-7.4 4.8 2.4-8.4-7-6 9-.6z"
          fill="#fff"
          fillOpacity="0.75"
        />
      </>
    );
  },
  function Pencil() {
    return (
      <>
        <rect
          x="98"
          y="30"
          width="16"
          height="52"
          rx="8"
          transform="rotate(28 106 56)"
          fill="#f75074"
        />
        <path d="M128 86l12 6-8-14z" fill="#fff3d1" />
        <circle cx="86" cy="36" r="7" fill="#fff" fillOpacity="0.7" />
      </>
    );
  },
];

export function CourseDoodle({ index }: { index: number }) {
  const Doodle = doodles[index % doodles.length];

  return (
    <svg
      viewBox="0 0 160 120"
      className="h-full w-full"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="118" cy="64" r="46" fill="#fff" fillOpacity="0.35" />
      <Doodle />
    </svg>
  );
}
