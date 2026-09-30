"use client";

import { useCallback, useEffect, useRef } from "react";

type ReadingDetectiveFrameProps = {
  gameUrl: string;
  token: string;
  apiBaseUrl: string;
  username?: string | null;
  yearGroup?: string;
  subject?: string;
};

export function ReadingDetectiveFrame({
  gameUrl,
  token,
  apiBaseUrl,
  username,
  yearGroup = "Year 6",
  subject = "Reading",
}: ReadingDetectiveFrameProps) {
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
    if (!frame || !token) {
      return;
    }

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
      if (!event.data || typeof event.data !== "object") {
        return;
      }

      if (event.data.type !== "GAME_READY") {
        return;
      }

      if (gamesOrigin !== "*" && event.origin !== gamesOrigin) {
        return;
      }

      sendInit();
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [gamesOrigin, sendInit]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!initSent.current) {
        sendInit();
      }
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [sendInit]);

  return (
    <iframe
      ref={iframeRef}
      src={gameUrl}
      title="BFT Detective"
      className="h-full min-h-[70vh] w-full flex-1 border-0"
      allow="fullscreen; gamepad; autoplay"
      allowFullScreen
      onLoad={() => {
        window.setTimeout(() => {
          if (!initSent.current) {
            sendInit();
          }
        }, 400);
      }}
    />
  );
}
