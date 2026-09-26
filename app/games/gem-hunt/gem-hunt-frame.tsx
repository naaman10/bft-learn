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
    console.log("[GemHuntFrame] sendInit called");
    console.log("[GemHuntFrame] frame exists:", !!frame);
    console.log("[GemHuntFrame] token exists:", !!token);
    console.log("[GemHuntFrame] gamesOrigin:", gamesOrigin);
    
    if (!frame || !token) {
      console.warn("[GemHuntFrame] Cannot send - missing frame or token");
      return;
    }

    console.log("[GemHuntFrame] Sending INIT_GAME with payload:", {
      hasToken: !!token,
      apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
      username,
      yearGroup,
      subject,
    });

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
    
    console.log("[GemHuntFrame] INIT_GAME sent successfully");
    initSent.current = true;
  }, [apiBaseUrl, gamesOrigin, subject, token, username, yearGroup]);

  useEffect(() => {
    console.log("[GemHuntFrame] Setting up message listener");
    console.log("[GemHuntFrame] Expected game origin:", gamesOrigin);
    
    const onMessage = (event: MessageEvent) => {
      console.log("[GemHuntFrame] Received message:", event.data);
      console.log("[GemHuntFrame] Message origin:", event.origin);
      
      if (gamesOrigin !== "*" && event.origin !== gamesOrigin) {
        console.warn("[GemHuntFrame] Origin mismatch - ignoring message");
        return;
      }
      if (!event.data || typeof event.data !== "object") {
        console.warn("[GemHuntFrame] Invalid message data");
        return;
      }
      if (event.data.type !== "GAME_READY") {
        console.log("[GemHuntFrame] Not GAME_READY, ignoring");
        return;
      }
      
      console.log("[GemHuntFrame] GAME_READY received! Calling sendInit");
      sendInit();
    };

    window.addEventListener("message", onMessage);
    return () => {
      console.log("[GemHuntFrame] Removing message listener");
      window.removeEventListener("message", onMessage);
    };
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
        console.log("[GemHuntFrame] Iframe loaded");
        // Backup if GAME_READY arrived before the listener was ready
        window.setTimeout(() => {
          console.log("[GemHuntFrame] Backup timeout - checking if init sent:", initSent.current);
          if (!initSent.current) {
            console.log("[GemHuntFrame] Init not sent, trying now");
            sendInit();
          }
        }, 400);
      }}
    />
  );
}
