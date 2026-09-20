"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { BookIcon } from "@/app/ui/icons";
import { CourseHeader } from "@/app/learn/course-header";
import {
  ReferenceMaterialPanel,
  type ReferenceTab,
} from "@/app/learn/reference-material-panel";

export function LearnCourseFrame({
  contentId,
  title,
  progressLabel,
  tags,
  sectionCount,
  referenceTabs,
  referencePanels,
  children,
}: {
  contentId: string;
  title: string;
  progressLabel?: string | null;
  tags: string[];
  sectionCount: number;
  referenceTabs: ReferenceTab[];
  referencePanels: ReactNode[];
  children: ReactNode;
}) {
  const params = useParams<{ contentId: string; sectionIndex?: string }>();
  const sectionIndex = Number.parseInt(String(params.sectionIndex ?? ""), 10);
  const sectionValid =
    Number.isInteger(sectionIndex) &&
    sectionIndex >= 0 &&
    sectionIndex < sectionCount;
  const unlocked =
    Number.isInteger(sectionIndex) &&
    sectionIndex > 0 &&
    referenceTabs.length > 0;
  const [overlayOpen, setOverlayOpen] = useState(false);
  const progressPercent =
    sectionCount === 0
      ? 0
      : Math.round(((sectionValid ? sectionIndex + 1 : 0) / sectionCount) * 100);

  useEffect(() => {
    if (!unlocked) {
      setOverlayOpen(false);
    }
  }, [unlocked]);

  useEffect(() => {
    if (!overlayOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOverlayOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [overlayOpen]);

  const split = unlocked;
  const header = (
    <CourseHeader
      title={title}
      progressLabel={progressLabel}
      tags={tags}
      progressPercent={progressPercent}
      showProgress={sectionCount > 0}
    />
  );
  const referencePanel = referenceTabs.length > 0 ? (
    <ReferenceMaterialPanel
      contentId={contentId}
      tabs={referenceTabs}
      panels={referencePanels}
      visible={unlocked}
      overlayOpen={overlayOpen}
      onCloseOverlay={() => setOverlayOpen(false)}
    />
  ) : null;
  const fab =
    unlocked && !overlayOpen ? (
      <button
        type="button"
        onClick={() => setOverlayOpen(true)}
        aria-label="Open reference material"
        className="fixed right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-[0_8px_18px_rgba(247,80,116,0.28)] hover:bg-accent-hover md:hidden"
        style={{
          bottom: "max(5.75rem, calc(env(safe-area-inset-bottom) + 4.75rem))",
        }}
      >
        <BookIcon className="h-6 w-6" />
      </button>
    ) : null;

  if (split) {
    return (
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 px-5 py-4 pb-[5.75rem] md:h-[calc(100dvh-4.5rem)] md:grid-cols-2 md:grid-rows-[auto_minmax(0,1fr)] md:gap-x-6 md:gap-y-5 md:overflow-hidden md:px-8 md:py-3 md:pb-8">
        <div className="md:col-start-1 md:row-start-1 md:px-3 md:pt-2">
          {header}
        </div>
        <div className="min-h-0 md:col-start-1 md:row-start-2 md:px-3 md:pb-5">
          {referencePanel}
        </div>
        <div className="relative flex min-h-0 min-w-0 flex-col md:col-start-2 md:row-start-2 md:overflow-y-auto md:px-3 md:pb-5">
          {children}
          {fab}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-4 pb-[5.75rem] md:px-8 md:py-2 md:pb-8">
      {referenceTabs.length > 0 ? (
        <div className="flex min-h-0 min-w-0 flex-col gap-5">
          {header}
          {referencePanel}
        </div>
      ) : (
        header
      )}
      <div className="relative flex min-h-0 min-w-0 flex-col">
        {children}
      </div>
    </div>
  );
}
