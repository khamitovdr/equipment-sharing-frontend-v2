"use client";

import { useEffect, useRef } from "react";
import {
  identifyUser,
  markTrackerStarted,
} from "@/lib/observability/openreplay-events";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";

const projectKey = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY;
const enabled = process.env.NODE_ENV === "production" && !!projectKey;

export default function OpenReplay() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    let unsubAuth: (() => void) | undefined;
    let unsubOrg: (() => void) | undefined;

    (async () => {
      const { tracker } = await import("@openreplay/tracker");
      if (cancelled) return;
      tracker.configure({ projectKey: projectKey! });
      tracker.start();
      markTrackerStarted();

      const pushIdentity = () => {
        const user = useAuthStore.getState().user;
        const { currentOrg, currentRole } = useOrgStore.getState();
        identifyUser(user, { org: currentOrg, role: currentRole });
      };

      pushIdentity();
      unsubAuth = useAuthStore.subscribe(pushIdentity);
      unsubOrg = useOrgStore.subscribe(pushIdentity);
    })();

    return () => {
      cancelled = true;
      unsubAuth?.();
      unsubOrg?.();
    };
  }, []);

  return null;
}
