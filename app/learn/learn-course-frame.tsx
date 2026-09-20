"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { BookIcon } from "@/app/ui/icons";
import {
  ReferenceMaterialPanel,
  type ReferenceTab,
} from "@/app/learn/reference-material-panel";

export function LearnCourseFrame({
  contentId,
  referenceTabs,
  referencePanels,
  children,
}: {
  contentId: string;
  referenceTabs: ReferenceTab[];
  referencePanels: ReactNode[];
  children: ReactNode;
}) {
  const params = useParams<{ contentId: string; sectionIndex?: string }>();
  const sectionIndex = Number.parseInt(String(params.sectionIndex ?? ""), 10);
  const unlocked =
    Number.isInteger(sectionIndex) &&
    sectionIndex > 0 &&
    referenceTabs.length > 0;
  const [overlayOpen, setOverlayOpen] = useState(false);

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

  return (
    <div
      className={
        split
          ? "mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 px-5 py-4 pb-[5.75rem] md:h-[calc(100dvh-4.5rem)] md:grid-cols-2 md:gap-6 md:overflow-hidden md:px-8 md:py-3 md:pb-8"
          : "mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-4 pb-[5.75rem] md:px-8 md:py-2 md:pb-8"
      }
    >
      {referenceTabs.length > 0 ? (
        <div className="flex min-h-0 min-w-0 flex-col md:px-3 md:pb-5 md:pt-2">
          <ReferenceMaterialPanel
            contentId={contentId}
            tabs={referenceTabs}
            panels={referencePanels}
            visible={unlocked}
            overlayOpen={overlayOpen}
            onCloseOverlay={() => setOverlayOpen(false)}
          />
        </div>
      ) : null}

      <div className="relative flex min-h-0 min-w-0 flex-col md:overflow-y-auto md:px-3 md:pb-5 md:pt-2">
        {children}
        {unlocked && !overlayOpen ? (
          <button
            type="button"
            onClick={() => setOverlayOpen(true)}
            aria-label="Open reference material"
            className="fixed right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-[0_8px_18px_rgba(247,80,116,0.28)] hover:bg-accent-hover md:hidden"
            style={{
              bottom:
                "max(5.75rem, calc(env(safe-area-inset-bottom) + 4.75rem))",
            }}
          >
            <BookIcon className="h-6 w-6" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
