"use client";

import { useEffect } from "react";
import { markTrackerStarted } from "@/lib/observability/openreplay-events";

const projectKey = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY;
const enabled = process.env.NODE_ENV === "production" && !!projectKey;

export default function OpenReplay() {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const { tracker } = await import("@openreplay/tracker");
      if (cancelled) return;
      tracker.configure({ projectKey: projectKey! });
      tracker.start();
      markTrackerStarted();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
