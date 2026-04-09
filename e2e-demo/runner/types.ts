import type { Page } from "@playwright/test";

// --- Role & Config ---

export type Role = string;

export interface RoleConfig {
  /** Pre-seeded credentials. null = flow registers a fresh user. */
  auth: { email: string; password: string } | null;
  /** URL to navigate to after login (relative to baseURL). */
  startUrl?: string;
}

// --- Steps ---

export interface ActionStep {
  role: Role;
  action: string;
  target?: string;
  data?: Record<string, unknown>;
  /** Human-readable description. Ignored by runner. */
  description?: string;
}

export interface SyncPoint {
  sync: string;
}

export interface PauseStep {
  role: Role;
  pause: number; // milliseconds
}

export type Step = ActionStep | SyncPoint | PauseStep;

// --- Flow ---

export interface FlowDefinition {
  name: string;
  description: string;
  viewport?: { width: number; height: number };
  roles: Record<Role, RoleConfig>;
  steps: Step[];
}

// --- Action Handler ---

export interface ActionContext {
  target?: string;
  data?: Record<string, unknown>;
  description?: string;
}

export type ActionHandler = (
  page: Page,
  ctx: ActionContext,
) => Promise<void>;

// --- Type Guards ---

export function isSyncPoint(step: Step): step is SyncPoint {
  return "sync" in step;
}

export function isPauseStep(step: Step): step is PauseStep {
  return "pause" in step;
}

export function isActionStep(step: Step): step is ActionStep {
  return "action" in step;
}
