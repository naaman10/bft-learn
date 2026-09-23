"use client";

import { useCallback, useEffect, useRef } from "react";

type GemHuntFrameProps = {
  gameUrl: string;
  token: string;
  apiBaseUrl: string;
  username?: string | null;
  yearGroup?: string;
  subject?: string;
};

export function GemHuntFrame({
  gameUrl,
  token,
  apiBaseUrl,
  username,
  yearGroup = "Year 6",
  subject = "Percentages",
}: GemHuntFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initSent = useRef(false);

  const gamesOrigin = (() => {
    try {
      return new URL(gameUrl).origin;
    } catch {
      return "*";
    }
  })();

  const sendInit = useCallback(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame || !token) return;

    frame.postMessage(
      {
        type: "INIT_GAME",
        payload: {
          token,
          apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
          username: username ?? undefined,
          yearGroup,
          subject,
        },
      },
      gamesOrigin
    );
    initSent.current = true;
  }, [apiBaseUrl, gamesOrigin, subject, token, username, yearGroup]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (gamesOrigin !== "*" && event.origin !== gamesOrigin) return;
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type !== "GAME_READY") return;
      sendInit();
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [gamesOrigin, sendInit]);

  return (
    <iframe
      ref={iframeRef}
      src={gameUrl}
      title="Gem Hunt"
      className="h-full min-h-[70vh] w-full flex-1 border-0"
      allow="fullscreen; gamepad; autoplay"
      allowFullScreen
      onLoad={() => {
        // Backup if GAME_READY arrived before the listener was ready
        window.setTimeout(() => {
          if (!initSent.current) sendInit();
        }, 400);
      }}
    />
  );
}
