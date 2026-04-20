import { tracker } from "@openreplay/tracker";
import type { UserRead } from "@/types/user";
import type { OrganizationRead, MembershipRole } from "@/types/organization";

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

export interface OrgContext {
  org: OrganizationRead | null;
  role: MembershipRole | null;
}

const USER_META_KEYS = [
  "user_id",
  "user_email",
  "user_phone",
  "user_full_name",
  "user_role",
  "user_created_at",
] as const;

const ORG_META_KEYS = ["org_id", "org_short_name", "org_role"] as const;

let lastUserId: string | null = null;
let lastOrgKey: string | null = null;

export function identifyUser(user: UserRead | null, orgCtx: OrgContext): void {
  if (!started) return;
  try {
    if (!user) {
      if (lastUserId !== null) {
        tracker.setUserID("");
        for (const k of USER_META_KEYS) tracker.setMetadata(k, "");
        for (const k of ORG_META_KEYS) tracker.setMetadata(k, "");
        lastUserId = null;
        lastOrgKey = null;
      }
      return;
    }

    if (lastUserId !== user.id) {
      const fullName = [user.name, user.middle_name, user.surname]
        .filter((p): p is string => !!p && p.trim().length > 0)
        .join(" ");
      tracker.setUserID(user.email);
      tracker.setMetadata("user_id", user.id);
      tracker.setMetadata("user_email", user.email);
      tracker.setMetadata("user_phone", user.phone ?? "");
      tracker.setMetadata("user_full_name", fullName);
      tracker.setMetadata("user_role", user.role);
      tracker.setMetadata("user_created_at", user.created_at);
      lastUserId = user.id;
      lastOrgKey = null;
    }

    const orgKey = `${orgCtx.org?.id ?? ""}|${orgCtx.role ?? ""}`;
    if (lastOrgKey !== orgKey) {
      tracker.setMetadata("org_id", orgCtx.org?.id ?? "");
      tracker.setMetadata("org_short_name", orgCtx.org?.short_name ?? "");
      tracker.setMetadata("org_role", orgCtx.role ?? "");
      lastOrgKey = orgKey;
    }
  } catch {
    // tracker in an invalid state — swallow
  }
}
