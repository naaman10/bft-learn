"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CloseIcon } from "@/app/ui/icons";

const storageKey = (contentId: string) => `learn:reference:${contentId}`;

type StoredPosition = {
  activeEntryId?: string;
  scrolls?: Record<string, number>;
};

export type ReferenceTab = {
  id: string;
  label: string;
};

function readStoredPosition(contentId: string): StoredPosition {
  try {
    const raw = sessionStorage.getItem(storageKey(contentId));
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as StoredPosition;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return {
      activeEntryId:
        typeof parsed.activeEntryId === "string"
          ? parsed.activeEntryId
          : undefined,
      scrolls:
        parsed.scrolls && typeof parsed.scrolls === "object"
          ? parsed.scrolls
          : {},
    };
  } catch {
    return {};
  }
}

function writeStoredPosition(contentId: string, position: StoredPosition) {
  try {
    sessionStorage.setItem(storageKey(contentId), JSON.stringify(position));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function ReferenceMaterialPanel({
  contentId,
  tabs,
  panels,
  visible,
  overlayOpen,
  onCloseOverlay,
}: {
  contentId: string;
  tabs: ReferenceTab[];
  panels: ReactNode[];
  visible: boolean;
  overlayOpen: boolean;
  onCloseOverlay: () => void;
}) {
  const firstId = tabs[0]?.id ?? "";
  const [activeEntryId, setActiveEntryId] = useState(firstId);
  const [scrolls, setScrolls] = useState<Record<string, number>>({});
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const restoredFor = useRef<string | null>(null);

  useEffect(() => {
    const stored = readStoredPosition(contentId);
    const knownIds = new Set(tabs.map((tab) => tab.id));
    const storedId =
      stored.activeEntryId && knownIds.has(stored.activeEntryId)
        ? stored.activeEntryId
        : firstId;

    setActiveEntryId(storedId);
    setScrolls(stored.scrolls ?? {});
    restoredFor.current = null;
  }, [contentId, firstId, tabs]);

  const panelClassName = !visible
    ? "hidden"
    : overlayOpen
      ? "fixed inset-0 z-40 flex flex-col bg-background md:static md:z-auto md:h-full md:min-h-0 md:w-full md:rounded-[28px] md:bg-card md:shadow-[var(--shadow-card)]"
      : "hidden md:flex md:h-full md:min-h-0 md:w-full md:flex-col md:rounded-[28px] md:bg-card md:shadow-[var(--shadow-card)]";

  useEffect(() => {
    const restoreKey = `${contentId}:${activeEntryId}:${String(visible)}:${String(overlayOpen)}`;
    if (!activeEntryId || restoredFor.current === restoreKey) {
      return;
    }

    const panel = panelRefs.current[activeEntryId];
    if (!panel) {
      return;
    }

    panel.scrollTop = scrolls[activeEntryId] ?? 0;
    restoredFor.current = restoreKey;
  }, [activeEntryId, contentId, overlayOpen, scrolls, visible]);

  const persist = useCallback(
    (nextActive: string, nextScrolls: Record<string, number>) => {
      writeStoredPosition(contentId, {
        activeEntryId: nextActive,
        scrolls: nextScrolls,
      });
    },
    [contentId]
  );

  const selectTab = (id: string) => {
    setActiveEntryId(id);
    persist(id, scrolls);
  };

  const onPanelScroll = (id: string, top: number) => {
    setScrolls((prev) => {
      const next = { ...prev, [id]: top };
      persist(activeEntryId, next);
      return next;
    });
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      className={panelClassName}
      hidden={!visible && !overlayOpen ? true : undefined}
      inert={!visible && !overlayOpen ? true : undefined}
      role={overlayOpen ? "dialog" : undefined}
      aria-modal={overlayOpen ? true : undefined}
      aria-hidden={!visible && !overlayOpen ? true : undefined}
      aria-label="Reference material"
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-4 md:pt-3">
        <div
          role="tablist"
          aria-label="Reference material"
          className="flex min-w-0 flex-1 gap-2 overflow-x-auto"
        >
          {tabs.map((tab) => {
            const selected = tab.id === activeEntryId;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`reference-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`reference-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                className={
                  selected
                    ? "shrink-0 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white"
                    : "shrink-0 rounded-full bg-background px-3 py-1.5 text-sm font-medium text-muted ring-1 ring-border hover:bg-white md:bg-accent-soft/60"
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onCloseOverlay}
          aria-label="Close reference material"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-card text-foreground shadow-[var(--shadow-card)] ring-1 ring-border md:hidden"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {tabs.map((tab, index) => {
          const selected = tab.id === activeEntryId;

          return (
            <div
              key={tab.id}
              ref={(node) => {
                panelRefs.current[tab.id] = node;
              }}
              id={`reference-panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`reference-tab-${tab.id}`}
              hidden={!selected}
              onScroll={(event) => onPanelScroll(tab.id, event.currentTarget.scrollTop)}
              className="absolute inset-0 overflow-y-auto p-5 sm:p-8"
            >
              {panels[index]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
