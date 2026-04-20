import { tracker } from "@openreplay/tracker";

let started = false;

export function markTrackerStarted(): void {
  started = true;
}

export interface ApiErrorInfo {
  traceId: string;
  status: number;
  path: string;
  method: string;
}

export function trackApiError(info: ApiErrorInfo): void {
  if (!started) return;
  try {
    tracker.event("api_error", info);
  } catch {
    // tracker in an invalid state (session not started, SSR, etc.) — swallow
  }
}
