"use client";

import { useCallback, useEffect, useRef } from "react";

type QuizGeneratorFrameProps = {
  gameUrl: string;
  token: string;
  apiBaseUrl: string;
  username?: string | null;
  yearGroup?: string;
  subject?: string;
};

export function QuizGeneratorFrame({
  gameUrl,
  token,
  apiBaseUrl,
  username,
  yearGroup = "Year 6",
  subject = "Percentages",
}: QuizGeneratorFrameProps) {
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
    console.log("[QuizGeneratorFrame] sendInit called");
    console.log("[QuizGeneratorFrame] frame exists:", !!frame);
    console.log("[QuizGeneratorFrame] token exists:", !!token);
    console.log("[QuizGeneratorFrame] gamesOrigin:", gamesOrigin);
    
    if (!frame || !token) {
      console.warn("[QuizGeneratorFrame] Cannot send - missing frame or token");
      return;
    }

    console.log("[QuizGeneratorFrame] Sending INIT_GAME with payload:", {
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
    
    console.log("[QuizGeneratorFrame] INIT_GAME sent successfully");
    initSent.current = true;
  }, [apiBaseUrl, gamesOrigin, subject, token, username, yearGroup]);

  useEffect(() => {
    console.log("[QuizGeneratorFrame] Setting up message listener");
    console.log("[QuizGeneratorFrame] Expected game origin:", gamesOrigin);
    
    const onMessage = (event: MessageEvent) => {
      console.log("[QuizGeneratorFrame] Received ANY message:", {
        type: event.data?.type,
        origin: event.origin,
        data: event.data
      });
      
      if (!event.data || typeof event.data !== "object") {
        return;
      }
      
      if (event.data.type === "GAME_READY") {
        console.log("[QuizGeneratorFrame] GAME_READY message detected!");
        console.log("[QuizGeneratorFrame] Message origin:", event.origin);
        console.log("[QuizGeneratorFrame] Expected origin:", gamesOrigin);
        
        if (gamesOrigin !== "*" && event.origin !== gamesOrigin) {
          console.error("[QuizGeneratorFrame] Origin mismatch! Expected:", gamesOrigin, "Got:", event.origin);
          return;
        }
        
        console.log("[QuizGeneratorFrame] GAME_READY received! Calling sendInit");
        sendInit();
      }
    };

    window.addEventListener("message", onMessage);
    return () => {
      console.log("[QuizGeneratorFrame] Removing message listener");
      window.removeEventListener("message", onMessage);
    };
  }, [gamesOrigin, sendInit]);

  useEffect(() => {
    console.log("[QuizGeneratorFrame] Setting up fallback timer");
    const timer = window.setTimeout(() => {
      console.log("[QuizGeneratorFrame] Fallback timer fired - checking if init sent:", initSent.current);
      if (!initSent.current) {
        console.log("[QuizGeneratorFrame] GAME_READY not received, sending INIT_GAME proactively");
        sendInit();
      }
    }, 1000);
    
    return () => {
      console.log("[QuizGeneratorFrame] Clearing fallback timer");
      window.clearTimeout(timer);
    };
  }, [sendInit]);

  return (
    <iframe
      ref={iframeRef}
      src={gameUrl}
      title="Quiz Generator"
      className="h-full min-h-[70vh] w-full flex-1 border-0"
      allow="fullscreen; gamepad; autoplay"
      allowFullScreen
      onLoad={() => {
        console.log("[QuizGeneratorFrame] Iframe loaded");
        window.setTimeout(() => {
          console.log("[QuizGeneratorFrame] Backup timeout - checking if init sent:", initSent.current);
          if (!initSent.current) {
            console.log("[QuizGeneratorFrame] Init not sent, trying now");
            sendInit();
          }
        }, 400);
      }}
    />
  );
}
