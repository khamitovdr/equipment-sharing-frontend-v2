# Demo Recordings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Playwright-based demo recording system using a declarative Screenplay DSL that produces polished marketing videos of all 6 major platform user flows, with synchronized multi-role support for side-by-side playback.

**Architecture:** A declarative Flow DSL (`FlowDefinition`) describes each demo as a list of typed steps across named roles. A runner engine interprets the DSL, creates one Playwright `BrowserContext` per role (each with video recording enabled), executes steps concurrently per role, and synchronizes them at named barriers. Output is `.webm` files per role per flow.

**Tech Stack:** Playwright (browser automation + video recording), TypeScript, tsx (script runner)

**Spec:** `docs/superpowers/specs/2026-04-09-demo-recordings-design.md`

---

## File Structure

```
e2e-demo/
├── playwright.config.ts          # Playwright config (baseURL, video, viewport)
├── run.ts                        # CLI entry point — parses args, discovers flows, runs engine
├── runner/
│   ├── types.ts                  # FlowDefinition, Step, ActionStep, SyncPoint, PauseStep, RoleConfig
│   ├── sync.ts                   # SyncCoordinator — barrier-based multi-role synchronization
│   ├── actions.ts                # ActionRegistry — built-in + custom action handlers
│   ├── engine.ts                 # FlowEngine — creates contexts, dispatches steps, produces recordings
│   └── recorder.ts               # moveRecordings() — renames Playwright's auto-named videos
├── flows/
│   ├── 01-registration.flow.ts
│   ├── 02-browse-and-order.flow.ts
│   ├── 03-create-organization.flow.ts
│   ├── 04-add-listing.flow.ts
│   ├── 05-order-lifecycle.flow.ts
│   └── 06-member-management.flow.ts
├── fixtures/
│   └── seed-data.ts              # Pre-seeded credentials, org IDs, listing IDs
├── helpers/
│   └── auth.ts                   # login() helper reused across flows
└── recordings/                   # Output (gitignored)
```

---

### Task 1: Project Setup

**Files:**
- Create: `e2e-demo/playwright.config.ts`
- Create: `e2e-demo/tsconfig.json`
- Modify: `package.json` (add scripts + devDependencies)
- Modify: `.gitignore` (add recordings)

- [ ] **Step 1: Install Playwright and tsx**

Run:
```bash
npm install --save-dev @playwright/test tsx
```

Expected: packages added to `devDependencies` in `package.json`

- [ ] **Step 2: Install Playwright browsers**

Run:
```bash
npx playwright install chromium
```

Expected: Chromium browser downloaded

- [ ] **Step 3: Create e2e-demo directory structure**

Run:
```bash
mkdir -p e2e-demo/runner e2e-demo/flows e2e-demo/fixtures e2e-demo/helpers e2e-demo/recordings
```

- [ ] **Step 4: Create e2e-demo/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@app/*": ["../src/*"]
    }
  },
  "include": ["./**/*.ts"],
  "exclude": ["dist", "recordings"]
}
```

- [ ] **Step 5: Create e2e-demo/playwright.config.ts**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: process.env.DEMO_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1280, height: 720 },
    video: {
      mode: "on",
      size: { width: 1280, height: 720 },
    },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    locale: "en",
  },
});
```

- [ ] **Step 6: Add recordings to .gitignore**

Append to `.gitignore`:
```
# Demo recordings
e2e-demo/recordings/
```

- [ ] **Step 7: Add npm scripts to package.json**

Add to `scripts`:
```json
"demo:record": "tsx e2e-demo/run.ts"
```

- [ ] **Step 8: Commit**

```bash
git add e2e-demo/ package.json package-lock.json .gitignore
git commit -m "chore: scaffold e2e-demo project with Playwright"
```

---

### Task 2: DSL Type Definitions

**Files:**
- Create: `e2e-demo/runner/types.ts`

- [ ] **Step 1: Write types.ts**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add e2e-demo/runner/types.ts
git commit -m "feat(e2e-demo): add Flow DSL type definitions"
```

---

### Task 3: Sync Coordinator

**Files:**
- Create: `e2e-demo/runner/sync.ts`
- Create: `e2e-demo/runner/__tests__/sync.test.ts`

- [ ] **Step 1: Write the failing test**

Create `e2e-demo/runner/__tests__/sync.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { SyncCoordinator } from "../sync.js";

describe("SyncCoordinator", () => {
  it("releases all roles when everyone arrives at the barrier", async () => {
    const sync = new SyncCoordinator(["user", "orgAdmin"]);
    const order: string[] = [];

    const p1 = sync.waitAtBarrier("ready", "user").then(() => order.push("user"));
    const p2 = sync.waitAtBarrier("ready", "orgAdmin").then(() => order.push("orgAdmin"));

    await Promise.all([p1, p2]);

    expect(order).toHaveLength(2);
    expect(order).toContain("user");
    expect(order).toContain("orgAdmin");
  });

  it("handles multiple sequential barriers", async () => {
    const sync = new SyncCoordinator(["a", "b"]);
    const log: string[] = [];

    const trackA = async () => {
      await sync.waitAtBarrier("first", "a");
      log.push("a:first");
      await sync.waitAtBarrier("second", "a");
      log.push("a:second");
    };

    const trackB = async () => {
      await sync.waitAtBarrier("first", "b");
      log.push("b:first");
      await sync.waitAtBarrier("second", "b");
      log.push("b:second");
    };

    await Promise.all([trackA(), trackB()]);

    expect(log).toEqual(
      expect.arrayContaining(["a:first", "b:first", "a:second", "b:second"]),
    );
  });

  it("times out if a role never arrives", async () => {
    const sync = new SyncCoordinator(["a", "b"], { timeoutMs: 200 });

    await expect(sync.waitAtBarrier("stuck", "a")).rejects.toThrow(
      /timed out/i,
    );
  });

  it("works with a single role (no blocking)", async () => {
    const sync = new SyncCoordinator(["solo"]);
    await sync.waitAtBarrier("point", "solo");
    // should resolve immediately
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run e2e-demo/runner/__tests__/sync.test.ts`
Expected: FAIL — module `../sync.js` not found

- [ ] **Step 3: Implement SyncCoordinator**

Create `e2e-demo/runner/sync.ts`:

```ts
interface Barrier {
  arrived: Set<string>;
  promise: Promise<void>;
  resolve: () => void;
}

export interface SyncOptions {
  timeoutMs?: number;
}

export class SyncCoordinator {
  private roles: string[];
  private barriers = new Map<string, Barrier>();
  private timeoutMs: number;

  constructor(roles: string[], options: SyncOptions = {}) {
    this.roles = roles;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  async waitAtBarrier(name: string, role: string): Promise<void> {
    const barrier = this.getOrCreateBarrier(name);
    barrier.arrived.add(role);

    if (barrier.arrived.size >= this.roles.length) {
      barrier.resolve();
      this.barriers.delete(name);
      return;
    }

    // Wait with timeout
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Sync barrier "${name}" timed out waiting for roles: ${this.roles.filter((r) => !barrier.arrived.has(r)).join(", ")}`)),
        this.timeoutMs,
      );
    });

    await Promise.race([barrier.promise, timeout]);
  }

  private getOrCreateBarrier(name: string): Barrier {
    let barrier = this.barriers.get(name);
    if (!barrier) {
      let resolve!: () => void;
      const promise = new Promise<void>((r) => {
        resolve = r;
      });
      barrier = { arrived: new Set(), promise, resolve };
      this.barriers.set(name, barrier);
    }
    return barrier;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run e2e-demo/runner/__tests__/sync.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add e2e-demo/runner/sync.ts e2e-demo/runner/__tests__/sync.test.ts
git commit -m "feat(e2e-demo): add SyncCoordinator with barrier-based synchronization"
```

---

### Task 4: Action Registry + Built-in Actions

**Files:**
- Create: `e2e-demo/runner/actions.ts`
- Create: `e2e-demo/runner/__tests__/actions.test.ts`

- [ ] **Step 1: Write the failing test for action registry**

Create `e2e-demo/runner/__tests__/actions.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { ActionRegistry } from "../actions.js";
import type { ActionHandler } from "../types.js";

describe("ActionRegistry", () => {
  it("registers and retrieves a custom action", () => {
    const registry = new ActionRegistry();
    const handler: ActionHandler = vi.fn();
    registry.register("myAction", handler);

    expect(registry.get("myAction")).toBe(handler);
  });

  it("throws on unknown action", () => {
    const registry = new ActionRegistry();
    expect(() => registry.get("nonexistent")).toThrow(/unknown action/i);
  });

  it("has built-in actions registered", () => {
    const registry = ActionRegistry.withBuiltins();
    expect(registry.get("navigate")).toBeDefined();
    expect(registry.get("click")).toBeDefined();
    expect(registry.get("fill")).toBeDefined();
    expect(registry.get("select")).toBeDefined();
    expect(registry.get("upload")).toBeDefined();
    expect(registry.get("scroll")).toBeDefined();
    expect(registry.get("waitFor")).toBeDefined();
    expect(registry.get("screenshot")).toBeDefined();
  });

  it("allows overriding built-in actions", () => {
    const registry = ActionRegistry.withBuiltins();
    const custom: ActionHandler = vi.fn();
    registry.register("click", custom);
    expect(registry.get("click")).toBe(custom);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run e2e-demo/runner/__tests__/actions.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ActionRegistry with built-in actions**

Create `e2e-demo/runner/actions.ts`:

```ts
import type { Page } from "@playwright/test";
import type { ActionHandler, ActionContext } from "./types.js";

/** Default human-pacing delay: 300ms center ±150ms jitter */
function humanDelay(): number {
  return 150 + Math.random() * 300;
}

async function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Built-in action handlers ---

const navigate: ActionHandler = async (page, { target }) => {
  if (!target) throw new Error("navigate requires a target URL path");
  await page.goto(target);
  await pause(humanDelay());
};

const click: ActionHandler = async (page, { target }) => {
  if (!target) throw new Error("click requires a target selector");
  await page.click(target);
  await pause(humanDelay());
};

const fill: ActionHandler = async (page, { target, data }) => {
  if (!target) throw new Error("fill requires a target selector");
  const value = String(data?.value ?? "");
  await page.fill(target, "");
  await page.type(target, value, { delay: 40 });
  await pause(humanDelay());
};

const select: ActionHandler = async (page, { target, data }) => {
  if (!target) throw new Error("select requires a target selector");
  const value = String(data?.value ?? "");
  await page.selectOption(target, value);
  await pause(humanDelay());
};

const upload: ActionHandler = async (page, { target, data }) => {
  if (!target) throw new Error("upload requires a target selector");
  const files = data?.files as string[] | undefined;
  if (!files?.length) throw new Error("upload requires data.files array");
  await page.setInputFiles(target, files);
  await pause(humanDelay());
};

const scroll: ActionHandler = async (page, { target }) => {
  if (target === "bottom") {
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
  } else if (target) {
    await page.locator(target).scrollIntoViewIfNeeded();
  }
  await pause(humanDelay());
};

const waitFor: ActionHandler = async (page, { target, data }) => {
  if (!target) throw new Error("waitFor requires a target selector");
  const state = (data?.state as "visible" | "attached") ?? "visible";
  await page.locator(target).waitFor({ state });
};

const screenshot: ActionHandler = async (page, { data }) => {
  const name = String(data?.name ?? "screenshot");
  await page.screenshot({ path: `e2e-demo/recordings/${name}.png` });
};

// --- Registry ---

export class ActionRegistry {
  private handlers = new Map<string, ActionHandler>();

  register(name: string, handler: ActionHandler): void {
    this.handlers.set(name, handler);
  }

  get(name: string): ActionHandler {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`Unknown action: "${name}". Register it with defineAction().`);
    }
    return handler;
  }

  static withBuiltins(): ActionRegistry {
    const registry = new ActionRegistry();
    registry.register("navigate", navigate);
    registry.register("click", click);
    registry.register("fill", fill);
    registry.register("select", select);
    registry.register("upload", upload);
    registry.register("scroll", scroll);
    registry.register("waitFor", waitFor);
    registry.register("screenshot", screenshot);
    return registry;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run e2e-demo/runner/__tests__/actions.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add e2e-demo/runner/actions.ts e2e-demo/runner/__tests__/actions.test.ts
git commit -m "feat(e2e-demo): add ActionRegistry with built-in actions"
```

---

### Task 5: Recorder Utility

**Files:**
- Create: `e2e-demo/runner/recorder.ts`

- [ ] **Step 1: Write recorder.ts**

Playwright saves videos with auto-generated names. This utility moves them to our naming scheme.

```ts
import { mkdir, rename } from "node:fs/promises";
import path from "node:path";
import type { BrowserContext } from "@playwright/test";

const RECORDINGS_DIR = path.resolve(import.meta.dirname, "../recordings");

export interface RecordingResult {
  role: string;
  path: string;
}

/**
 * After a context is closed, move its auto-named video to
 * `recordings/<flowName>/<role>.webm`.
 */
export async function saveRecording(
  context: BrowserContext,
  flowName: string,
  role: string,
): Promise<RecordingResult> {
  const pages = context.pages();
  const page = pages[0];
  if (!page) throw new Error(`No pages in context for role "${role}"`);

  // Close context to finalize the video file
  const video = page.video();
  if (!video) throw new Error(`No video for role "${role}" — is video recording enabled?`);

  const srcPath = await video.path();
  if (!srcPath) throw new Error(`Video path is null for role "${role}"`);

  const destDir = path.join(RECORDINGS_DIR, flowName);
  await mkdir(destDir, { recursive: true });
  const destPath = path.join(destDir, `${role}.webm`);

  await rename(srcPath, destPath);

  return { role, path: destPath };
}
```

- [ ] **Step 2: Commit**

```bash
git add e2e-demo/runner/recorder.ts
git commit -m "feat(e2e-demo): add recording file management utility"
```

---

### Task 6: Flow Engine

**Files:**
- Create: `e2e-demo/runner/engine.ts`

- [ ] **Step 1: Write engine.ts**

This is the core orchestrator that ties everything together.

```ts
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import config from "../playwright.config.js";
import { SyncCoordinator } from "./sync.js";
import { ActionRegistry } from "./actions.js";
import { saveRecording, type RecordingResult } from "./recorder.js";
import { login } from "../helpers/auth.js";
import {
  type FlowDefinition,
  type Step,
  type ActionHandler,
  isActionStep,
  isSyncPoint,
  isPauseStep,
} from "./types.js";

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface EngineOptions {
  /** Only record this role (skip others). */
  filterRole?: string;
}

export class FlowEngine {
  private registry: ActionRegistry;

  constructor(registry?: ActionRegistry) {
    this.registry = registry ?? ActionRegistry.withBuiltins();
  }

  /** Register a custom action handler available to all flows. */
  defineAction(name: string, handler: ActionHandler): void {
    this.registry.register(name, handler);
  }

  async run(flow: FlowDefinition, options: EngineOptions = {}): Promise<RecordingResult[]> {
    const roleNames = Object.keys(flow.roles);
    const activeRoles = options.filterRole
      ? roleNames.filter((r) => r === options.filterRole)
      : roleNames;

    if (activeRoles.length === 0) {
      throw new Error(`Role "${options.filterRole}" not found in flow "${flow.name}". Available: ${roleNames.join(", ")}`);
    }

    const useConfig = config.use ?? {};
    const viewport = flow.viewport ?? useConfig.viewport ?? { width: 1280, height: 720 };
    const baseURL = (useConfig.baseURL as string) ?? "http://localhost:3000";

    const browser = await chromium.launch({ headless: true });
    const sync = new SyncCoordinator(activeRoles);

    // Create one BrowserContext per active role
    const contexts = new Map<string, { context: BrowserContext; page: Page }>();
    for (const role of activeRoles) {
      const context = await browser.newContext({
        viewport,
        recordVideo: {
          dir: `e2e-demo/recordings/.tmp-${flow.name}`,
          size: viewport,
        },
        baseURL,
      });
      const page = await context.newPage();

      // Login if role has auth
      const roleConfig = flow.roles[role];
      if (roleConfig.auth) {
        await login(page, roleConfig.auth.email, roleConfig.auth.password);
      }

      // Navigate to startUrl if specified
      if (roleConfig.startUrl) {
        await page.goto(roleConfig.startUrl);
        await pause(300);
      }

      contexts.set(role, { context, page });
    }

    // Split steps into per-role tracks
    const tracks = new Map<string, Step[]>();
    for (const role of activeRoles) {
      tracks.set(role, []);
    }

    for (const step of flow.steps) {
      if (isSyncPoint(step)) {
        // Sync points go to all active roles
        for (const role of activeRoles) {
          tracks.get(role)!.push(step);
        }
      } else if (isActionStep(step) || isPauseStep(step)) {
        const role = step.role;
        if (activeRoles.includes(role)) {
          tracks.get(role)!.push(step);
        }
      }
    }

    // Execute each role's track concurrently
    const errors: Error[] = [];

    await Promise.all(
      activeRoles.map(async (role) => {
        const { page } = contexts.get(role)!;
        const steps = tracks.get(role)!;

        for (const step of steps) {
          try {
            if (isSyncPoint(step)) {
              console.log(`  [${role}] ⏳ sync:${step.sync}`);
              await sync.waitAtBarrier(step.sync, role);
              console.log(`  [${role}] ✅ sync:${step.sync}`);
            } else if (isPauseStep(step)) {
              console.log(`  [${role}] ⏸  pause ${step.pause}ms`);
              await pause(step.pause);
            } else if (isActionStep(step)) {
              const label = step.description ?? `${step.action}(${step.target ?? ""})`;
              console.log(`  [${role}] ▶  ${label}`);
              const handler = this.registry.get(step.action);
              await handler(page, {
                target: step.target,
                data: step.data,
                description: step.description,
              });
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(`  [${role}] ❌ ${error.message}`);
            // Take error screenshot
            const name = `error-${flow.name}-${role}`;
            await page.screenshot({ path: `e2e-demo/recordings/${name}.png` }).catch(() => {});
            errors.push(error);
            break; // Stop this role's track
          }
        }
      }),
    );

    // Save recordings
    const results: RecordingResult[] = [];
    for (const role of activeRoles) {
      const { context } = contexts.get(role)!;
      try {
        const result = await saveRecording(context, flow.name, role);
        results.push(result);
        console.log(`  [${role}] 🎬 saved → ${result.path}`);
      } catch (err) {
        console.error(`  [${role}] ⚠️  failed to save recording: ${err}`);
      }
      await context.close();
    }

    await browser.close();

    if (errors.length > 0) {
      console.error(`\n⚠️  Flow "${flow.name}" completed with ${errors.length} error(s)`);
    }

    return results;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add e2e-demo/runner/engine.ts
git commit -m "feat(e2e-demo): add FlowEngine — core orchestrator for multi-role recording"
```

---

### Task 7: CLI Entry Point

**Files:**
- Create: `e2e-demo/run.ts`

- [ ] **Step 1: Write run.ts**

```ts
import path from "node:path";
import { readdir } from "node:fs/promises";
import { FlowEngine } from "./runner/engine.js";
import type { FlowDefinition, ActionHandler } from "./runner/types.js";

interface FlowModule {
  default: FlowDefinition;
  actions?: Record<string, ActionHandler>;
}

async function main() {
  const args = process.argv.slice(2);

  // Parse --flow and --role flags
  let flowFilter: string | undefined;
  let roleFilter: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--flow" && args[i + 1]) flowFilter = args[++i];
    if (args[i] === "--role" && args[i + 1]) roleFilter = args[++i];
  }

  // Discover flow files
  const flowsDir = path.resolve(import.meta.dirname, "flows");
  const files = await readdir(flowsDir);
  const flowFiles = files
    .filter((f) => f.endsWith(".flow.ts"))
    .filter((f) => !flowFilter || f.includes(flowFilter))
    .sort();

  if (flowFiles.length === 0) {
    console.error(`No flow files found${flowFilter ? ` matching "${flowFilter}"` : ""}`);
    process.exit(1);
  }

  console.log(`\n🎬 Demo Recorder — ${flowFiles.length} flow(s) to record\n`);

  const engine = new FlowEngine();

  for (const file of flowFiles) {
    const modulePath = path.join(flowsDir, file);
    const mod = (await import(modulePath)) as FlowModule;
    const flow = mod.default;

    // Register any custom actions exported by the flow
    if (mod.actions) {
      for (const [name, handler] of Object.entries(mod.actions)) {
        engine.defineAction(name, handler);
      }
    }

    console.log(`📹 ${flow.name}: ${flow.description}`);

    const results = await engine.run(flow, { filterRole: roleFilter });

    console.log(`   ✅ ${results.length} recording(s)\n`);
  }

  console.log("🎬 Done!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add e2e-demo/run.ts
git commit -m "feat(e2e-demo): add CLI entry point for recording flows"
```

---

### Task 8: Seed Data + Auth Helper

**Files:**
- Create: `e2e-demo/fixtures/seed-data.ts`
- Create: `e2e-demo/helpers/auth.ts`

- [ ] **Step 1: Create seed-data.ts**

These credentials must exist on the target environment. The values here are placeholders that should be updated to match actual seeded data.

```ts
/**
 * Pre-seeded test data. Update these values to match
 * the accounts/data available on your target environment.
 *
 * Run against: DEMO_BASE_URL (default http://localhost:3000)
 */

export const users = {
  /** Regular user for renting equipment */
  renter: {
    email: "demo-renter@equip-me.ru",
    password: "DemoRenter123",
    name: "Алексей",
    surname: "Петров",
  },
  /** Org admin with an existing organization */
  orgAdmin: {
    email: "demo-admin@equip-me.ru",
    password: "DemoAdmin123",
    name: "Мария",
    surname: "Иванова",
  },
  /** User who will be invited to org (not yet a member) */
  invitee: {
    email: "demo-invitee@equip-me.ru",
    password: "DemoInvitee123",
    name: "Дмитрий",
    surname: "Козлов",
  },
  /** Fresh user for registration flow (NOT pre-seeded — created during flow) */
  fresh: {
    email: "demo-fresh@equip-me.ru",
    password: "DemoFresh123",
    name: "Иван",
    surname: "Сидоров",
    phone: "+7 (999) 123-45-67",
  },
} as const;

export const org = {
  /** Pre-seeded org owned by orgAdmin */
  id: "REPLACE_WITH_ACTUAL_ORG_ID",
  name: "ООО Демо Техника",
  inn: "7707083893",
} as const;

export const listings = {
  /** A published listing in the pre-seeded org, used for order flows */
  forOrder: {
    id: "REPLACE_WITH_ACTUAL_LISTING_ID",
    name: "Экскаватор CAT 320",
  },
} as const;

/** Demo photos for listing creation flow */
export const demoPhotos = [
  "e2e-demo/fixtures/assets/demo-photo-1.jpg",
  "e2e-demo/fixtures/assets/demo-photo-2.jpg",
  "e2e-demo/fixtures/assets/demo-photo-3.jpg",
] as const;

/** Demo avatar for registration flow */
export const demoAvatar = "e2e-demo/fixtures/assets/demo-avatar.jpg";
```

- [ ] **Step 2: Create placeholder asset directory**

Run:
```bash
mkdir -p e2e-demo/fixtures/assets
```

Then place demo images (any JPG files) into `e2e-demo/fixtures/assets/`. For example, download placeholder images or use existing project assets.

- [ ] **Step 3: Create auth.ts helper**

```ts
import type { Page } from "@playwright/test";

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log in via the login page.
 * Assumes page is at any URL — navigates to /en/login.
 */
export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/en/login");
  await page.fill("#email", email);
  await page.type("#password", password, { delay: 40 });
  await pause(200);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 10_000,
  });
  await pause(500);
}
```

- [ ] **Step 4: Commit**

```bash
git add e2e-demo/fixtures/ e2e-demo/helpers/auth.ts
git commit -m "feat(e2e-demo): add seed data config and login helper"
```

---

### Task 9: Flow 01 — Registration + Profile Setup

**Files:**
- Create: `e2e-demo/flows/01-registration.flow.ts`

- [ ] **Step 1: Write the flow**

```ts
import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users, demoAvatar } from "../fixtures/seed-data.js";

const fillRegistrationForm: ActionHandler = async (page, { data }) => {
  const u = data as typeof users.fresh;

  // Upload avatar
  const fileInput = page.locator('input[type="file"][accept="image/*"]');
  await fileInput.setInputFiles(demoAvatar);
  await page.waitForTimeout(1000); // wait for upload

  // Fill text fields
  await page.fill("#name", u.name);
  await page.fill("#surname", u.surname);
  await page.fill("#email", u.email);

  // Phone — custom component, type into visible input
  const phoneInput = page.locator('input[type="tel"]');
  await phoneInput.click();
  await phoneInput.fill(u.phone);

  // Password fields
  await page.type("#password", u.password, { delay: 30 });
  await page.type("#confirm_password", u.password, { delay: 30 });
};

const flow: FlowDefinition = {
  name: "01-registration",
  description: "New user signs up, uploads avatar, and lands on home page",
  roles: {
    user: { auth: null }, // No login — registering fresh
  },
  steps: [
    { role: "user", action: "navigate", target: "/en/register", description: "Go to register page" },
    { role: "user", pause: 500 },
    { role: "user", action: "fillRegistrationForm", data: users.fresh as any, description: "Fill registration form" },
    { role: "user", pause: 500 },
    { role: "user", action: "click", target: 'button[type="submit"]', description: "Submit registration" },
    { role: "user", action: "waitFor", target: "text=Equip Me", data: { state: "visible" }, description: "Wait for home page" },
    { role: "user", pause: 2000 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = { fillRegistrationForm };
```

- [ ] **Step 2: Commit**

```bash
git add e2e-demo/flows/01-registration.flow.ts
git commit -m "feat(e2e-demo): add flow 01 — registration + profile setup"
```

---

### Task 10: Flow 02 — Browse Catalog + Place Order

**Files:**
- Create: `e2e-demo/flows/02-browse-and-order.flow.ts`

- [ ] **Step 1: Write the flow**

```ts
import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users } from "../fixtures/seed-data.js";

const selectDatesAndOrder: ActionHandler = async (page) => {
  // The reservation calendar uses react-day-picker
  // Click two dates in the visible calendar to select a range
  const calendarDays = page.locator('button.rdp-day:not([disabled])');
  const count = await calendarDays.count();

  if (count < 2) {
    throw new Error("Not enough available dates in the calendar");
  }

  // Click start date (first available)
  await calendarDays.nth(0).click();
  await page.waitForTimeout(300);

  // Click end date (a few days later)
  const endIdx = Math.min(4, count - 1);
  await calendarDays.nth(endIdx).click();
  await page.waitForTimeout(500);
};

const flow: FlowDefinition = {
  name: "02-browse-and-order",
  description: "User browses catalog, views listing, and places a rental order",
  roles: {
    user: { auth: users.renter },
  },
  steps: [
    // Browse catalog
    { role: "user", action: "navigate", target: "/en/listings", description: "Open catalog" },
    { role: "user", pause: 1000 },

    // Apply a category filter
    { role: "user", action: "applyCategoryFilter", description: "Select a category to filter" },
    { role: "user", pause: 800 },

    { role: "user", action: "scroll", target: "bottom", description: "Scroll through filtered listings" },
    { role: "user", pause: 800 },
    { role: "user", action: "scroll", target: "body", description: "Scroll back to top" },
    { role: "user", pause: 500 },

    // Click first listing
    { role: "user", action: "click", target: "a[href*='/listings/']", description: "Click first listing" },
    { role: "user", action: "waitFor", target: "text=Request rental", description: "Wait for listing detail" },
    { role: "user", pause: 1000 },

    // Scroll to order form
    { role: "user", action: "scroll", target: "text=Select rental dates", description: "Scroll to calendar" },
    { role: "user", pause: 500 },

    // Select dates
    { role: "user", action: "selectDatesAndOrder", description: "Pick date range on calendar" },
    { role: "user", pause: 500 },

    // Submit order
    { role: "user", action: "click", target: "text=Request rental", description: "Submit rental request" },
    { role: "user", pause: 2000 },
  ],
};

const applyCategoryFilter: ActionHandler = async (page) => {
  // Click the category filter to expand it, then pick the first option
  const categoryCheckbox = page.locator('[data-slot="checkbox"]').first();
  if (await categoryCheckbox.isVisible()) {
    await categoryCheckbox.click();
    await page.waitForTimeout(800);
  }
};

export default flow;
export const actions: Record<string, ActionHandler> = { selectDatesAndOrder, applyCategoryFilter };
```

- [ ] **Step 2: Commit**

```bash
git add e2e-demo/flows/02-browse-and-order.flow.ts
git commit -m "feat(e2e-demo): add flow 02 — browse catalog + place order"
```

---

### Task 11: Flow 03 — Create Organization

**Files:**
- Create: `e2e-demo/flows/03-create-organization.flow.ts`

- [ ] **Step 1: Write the flow**

```ts
import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users, org } from "../fixtures/seed-data.js";

const searchAndSelectOrg: ActionHandler = async (page) => {
  // Type INN into Dadata search input
  const searchInput = page.locator('input[placeholder="Enter organization name or INN"]');
  await searchInput.click();
  await searchInput.type(org.inn, { delay: 60 });

  // Wait for Dadata suggestions dropdown
  await page.waitForTimeout(1500); // Dadata has 300ms debounce + network

  // Click first suggestion
  const suggestion = page.locator("ul > li > button").first();
  await suggestion.waitFor({ state: "visible", timeout: 5000 });
  await suggestion.click();
  await page.waitForTimeout(500);
};

const fillContacts: ActionHandler = async (page) => {
  await page.fill('#contacts-0-display-name', "Отдел аренды");

  const phoneInput = page.locator('#contacts-0-phone');
  await phoneInput.click();
  await phoneInput.fill("+7 (495) 123-45-67");

  await page.fill('#contacts-0-email', "rent@demo-org.ru");
  await page.waitForTimeout(300);
};

const flow: FlowDefinition = {
  name: "03-create-organization",
  description: "User creates an organization via INN lookup with Dadata autofill",
  roles: {
    user: { auth: users.renter },
  },
  steps: [
    { role: "user", action: "navigate", target: "/en/organizations/new", description: "Go to create org page" },
    { role: "user", pause: 800 },

    // Search org by INN
    { role: "user", action: "searchAndSelectOrg", description: "Search org by INN and select from Dadata" },
    { role: "user", pause: 1000 },

    // Fill contacts
    { role: "user", action: "fillContacts", description: "Fill contact details" },
    { role: "user", pause: 500 },

    // Submit
    { role: "user", action: "click", target: 'button[type="submit"]', description: "Create organization" },
    { role: "user", action: "waitFor", target: "text=Listings", data: { state: "visible" }, description: "Wait for org dashboard" },
    { role: "user", pause: 2000 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = { searchAndSelectOrg, fillContacts };
```

- [ ] **Step 2: Commit**

```bash
git add e2e-demo/flows/03-create-organization.flow.ts
git commit -m "feat(e2e-demo): add flow 03 — create organization"
```

---

### Task 12: Flow 04 — Add Equipment Listing

**Files:**
- Create: `e2e-demo/flows/04-add-listing.flow.ts`

- [ ] **Step 1: Write the flow**

```ts
import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users, demoPhotos } from "../fixtures/seed-data.js";

const fillListingForm: ActionHandler = async (page) => {
  // Name
  await page.fill("#name", "Бульдозер Komatsu D65");
  await page.waitForTimeout(200);

  // Category — click the select trigger, then pick an option
  const categoryTrigger = page.locator('button[role="combobox"]').first();
  await categoryTrigger.click();
  await page.waitForTimeout(300);
  // Pick first available category option
  const option = page.locator('[role="option"]').first();
  await option.click();
  await page.waitForTimeout(200);

  // Price
  await page.fill("#price", "15000");
  await page.waitForTimeout(200);

  // Description
  await page.locator("textarea").fill(
    "Мощный бульдозер для земляных работ. Отличное техническое состояние.",
  );
  await page.waitForTimeout(200);
};

const addSpecifications: ActionHandler = async (page) => {
  // Click "Add specification" button
  const addBtn = page.locator("text=Add specification");
  await addBtn.click();
  await page.waitForTimeout(200);

  // Fill first spec
  const keyInputs = page.locator('input[placeholder="Name"]');
  const valueInputs = page.locator('input[placeholder="Value"]');
  await keyInputs.nth(0).fill("Мощность");
  await valueInputs.nth(0).fill("205 л.с.");
  await page.waitForTimeout(200);

  // Add second spec
  await addBtn.click();
  await page.waitForTimeout(200);
  await keyInputs.nth(1).fill("Вес");
  await valueInputs.nth(1).fill("20 500 кг");
  await page.waitForTimeout(200);
};

const toggleServiceFlags: ActionHandler = async (page) => {
  await page.locator("#delivery").check();
  await page.waitForTimeout(200);
  await page.locator("#with_operator").check();
  await page.waitForTimeout(200);
  await page.locator("#setup").check();
  await page.waitForTimeout(200);
};

const uploadPhotos: ActionHandler = async (page) => {
  const fileInput = page.locator('input[type="file"][accept="image/jpeg,image/png,image/webp"]');
  await fileInput.setInputFiles([...demoPhotos]);
  // Wait for uploads to complete (polling for ready status)
  await page.waitForTimeout(5000);
};

const flow: FlowDefinition = {
  name: "04-add-listing",
  description: "Org admin creates a new equipment listing with photos and specs",
  roles: {
    orgAdmin: {
      auth: users.orgAdmin,
      startUrl: "/en/org/listings/new",
    },
  },
  steps: [
    { role: "orgAdmin", pause: 1000 },

    // Fill main form fields
    { role: "orgAdmin", action: "fillListingForm", description: "Fill listing name, category, price, description" },
    { role: "orgAdmin", pause: 500 },

    // Add specifications
    { role: "orgAdmin", action: "scroll", target: "text=Specifications", description: "Scroll to specs" },
    { role: "orgAdmin", action: "addSpecifications", description: "Add specification key-value pairs" },
    { role: "orgAdmin", pause: 500 },

    // Toggle service flags
    { role: "orgAdmin", action: "scroll", target: "text=Service options", description: "Scroll to service options" },
    { role: "orgAdmin", action: "toggleServiceFlags", description: "Enable delivery, operator, setup" },
    { role: "orgAdmin", pause: 500 },

    // Upload photos
    { role: "orgAdmin", action: "scroll", target: "text=Photos", description: "Scroll to photos" },
    { role: "orgAdmin", action: "uploadPhotos", description: "Upload 3 demo photos" },
    { role: "orgAdmin", pause: 500 },

    // Submit
    { role: "orgAdmin", action: "scroll", target: "body", description: "Scroll back to top" },
    { role: "orgAdmin", pause: 300 },
    { role: "orgAdmin", action: "click", target: 'button[type="submit"]', description: "Save listing" },
    { role: "orgAdmin", pause: 2000 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = {
  fillListingForm,
  addSpecifications,
  toggleServiceFlags,
  uploadPhotos,
};
```

- [ ] **Step 2: Commit**

```bash
git add e2e-demo/flows/04-add-listing.flow.ts
git commit -m "feat(e2e-demo): add flow 04 — add equipment listing"
```

---

### Task 13: Flow 05 — Order Lifecycle (Side-by-Side)

**Files:**
- Create: `e2e-demo/flows/05-order-lifecycle.flow.ts`

- [ ] **Step 1: Write the flow**

```ts
import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users, listings } from "../fixtures/seed-data.js";

const selectDatesAndOrder: ActionHandler = async (page) => {
  const calendarDays = page.locator('button.rdp-day:not([disabled])');
  const count = await calendarDays.count();
  if (count < 2) throw new Error("Not enough available dates");

  await calendarDays.nth(0).click();
  await page.waitForTimeout(300);
  await calendarDays.nth(Math.min(4, count - 1)).click();
  await page.waitForTimeout(500);
};

const makeOffer: ActionHandler = async (page) => {
  // Click "Make offer" button
  const makeOfferBtn = page.locator("text=Make offer").first();
  await makeOfferBtn.click();
  await page.waitForTimeout(500);

  // Fill offer form
  await page.fill("#offered_cost", "12000");
  await page.waitForTimeout(200);

  // Submit offer
  const sendBtn = page.locator("text=Send offer");
  await sendBtn.click();
  await page.waitForTimeout(1000);
};

const acceptOffer: ActionHandler = async (page) => {
  // Reload to see updated status
  await page.reload();
  await page.waitForTimeout(1000);

  const acceptBtn = page.locator("text=Accept offer");
  await acceptBtn.waitFor({ state: "visible", timeout: 10_000 });
  await acceptBtn.click();
  await page.waitForTimeout(1000);
};

const approveOrder: ActionHandler = async (page) => {
  // Reload to see updated status
  await page.reload();
  await page.waitForTimeout(1000);

  const approveBtn = page.locator("text=Approve");
  await approveBtn.waitFor({ state: "visible", timeout: 10_000 });
  await approveBtn.click();
  await page.waitForTimeout(1000);
};

const flow: FlowDefinition = {
  name: "05-order-lifecycle",
  description: "Full order lifecycle: user places order, org makes offer, user accepts, org approves",
  roles: {
    user: { auth: users.renter },
    orgAdmin: { auth: users.orgAdmin },
  },
  steps: [
    // --- Both login and arrive at starting positions ---
    { role: "user", action: "navigate", target: "/en/listings", description: "User opens catalog" },
    { role: "orgAdmin", action: "navigate", target: "/en/org/orders", description: "OrgAdmin opens orders dashboard" },
    { sync: "ready" },
    { role: "user", pause: 500 },
    { role: "orgAdmin", pause: 500 },

    // --- User places order ---
    { role: "user", action: "click", target: `a[href*='/listings/']`, description: "User clicks first listing" },
    { role: "user", action: "waitFor", target: "text=Request rental", description: "Wait for listing detail" },
    { role: "user", pause: 500 },
    { role: "user", action: "scroll", target: "text=Select rental dates", description: "Scroll to calendar" },
    { role: "user", pause: 500 },
    { role: "user", action: "selectDatesAndOrder", description: "Pick dates" },
    { role: "user", pause: 300 },
    { role: "user", action: "click", target: "text=Request rental", description: "Submit order" },
    { role: "user", pause: 1000 },

    // Navigate to user's orders to watch status
    { role: "user", action: "navigate", target: "/en/orders", description: "User goes to My Orders" },
    { role: "user", action: "waitFor", target: "text=Pending", description: "See pending order" },
    { role: "user", pause: 500 },
    // Click into the order detail
    { role: "user", action: "click", target: "tr:has(text=Pending)", description: "Open order detail" },
    { role: "user", pause: 500 },
    { sync: "order-placed" },

    // --- OrgAdmin sees new order and makes offer ---
    { role: "orgAdmin", action: "navigate", target: "/en/org/orders", description: "Refresh orders list" },
    { role: "orgAdmin", action: "waitFor", target: "text=Pending", description: "See incoming order" },
    { role: "orgAdmin", pause: 500 },
    { role: "orgAdmin", action: "click", target: "tr:has(text=Pending)", description: "Open order detail" },
    { role: "orgAdmin", pause: 800 },
    { role: "orgAdmin", action: "makeOffer", description: "Fill and submit counter-offer" },
    { sync: "offer-made" },

    // --- User accepts the offer ---
    { role: "user", action: "acceptOffer", description: "Reload and accept the offer" },
    { sync: "offer-accepted" },

    // --- OrgAdmin approves ---
    { role: "orgAdmin", action: "approveOrder", description: "Reload and approve the order" },
    { sync: "confirmed" },

    // --- Both see final state ---
    { role: "user", action: "navigate", target: "/en/orders", description: "User views final state" },
    { role: "user", pause: 1500 },
    { role: "orgAdmin", pause: 1500 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = {
  selectDatesAndOrder,
  makeOffer,
  acceptOffer,
  approveOrder,
};
```

- [ ] **Step 2: Commit**

```bash
git add e2e-demo/flows/05-order-lifecycle.flow.ts
git commit -m "feat(e2e-demo): add flow 05 — order lifecycle (side-by-side)"
```

---

### Task 14: Flow 06 — Member Management (Side-by-Side)

**Files:**
- Create: `e2e-demo/flows/06-member-management.flow.ts`

- [ ] **Step 1: Write the flow**

```ts
import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users } from "../fixtures/seed-data.js";

const searchAndInviteUser: ActionHandler = async (page, { data }) => {
  const email = String(data?.email ?? "");

  // Type email into user search input
  const searchInput = page.locator('input[placeholder="Search by email"]');
  await searchInput.click();
  await searchInput.type(email, { delay: 40 });
  await page.waitForTimeout(1500); // debounce + API call

  // Click the found user in results
  const userResult = page.locator("ul > li > button, [role='option']").first();
  await userResult.waitFor({ state: "visible", timeout: 5000 });
  await userResult.click();
  await page.waitForTimeout(500);

  // Select "Editor" role
  const roleSelect = page.locator("#role-select");
  await roleSelect.click();
  await page.waitForTimeout(200);
  const editorOption = page.locator('[role="option"]:has-text("Editor")');
  await editorOption.click();
  await page.waitForTimeout(300);

  // Submit invitation
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
};

const acceptInvitation: ActionHandler = async (page) => {
  // The invitee navigates to the org page and joins
  // Look for the "Join" or accept invitation button
  // This depends on how invitations surface — check org listing or notifications
  await page.reload();
  await page.waitForTimeout(1000);

  // Look for invitation acceptance UI
  const acceptBtn = page.locator("text=Accept").or(page.locator("text=Join"));
  if (await acceptBtn.isVisible()) {
    await acceptBtn.click();
    await page.waitForTimeout(1000);
  }
};

const flow: FlowDefinition = {
  name: "06-member-management",
  description: "Org admin invites a user by email, invitee accepts, admin sees new member",
  roles: {
    orgAdmin: {
      auth: users.orgAdmin,
      startUrl: "/en/org/members/invite",
    },
    invitee: {
      auth: users.invitee,
    },
  },
  steps: [
    // --- Both start ---
    { role: "orgAdmin", pause: 800 },
    { role: "invitee", action: "navigate", target: "/en", description: "Invitee at home page" },
    { sync: "ready" },

    // --- OrgAdmin invites the user ---
    { role: "orgAdmin", action: "searchAndInviteUser", data: { email: users.invitee.email }, description: "Search user by email and send invitation" },
    { role: "orgAdmin", pause: 500 },
    { sync: "invite-sent" },

    // --- Invitee accepts ---
    // Navigate to the org page (invitation may appear in org context)
    { role: "invitee", action: "navigate", target: "/en/organizations", description: "Invitee browses organizations" },
    { role: "invitee", pause: 800 },
    { role: "invitee", action: "acceptInvitation", description: "Accept the invitation" },
    { sync: "invite-accepted" },

    // --- OrgAdmin sees new member ---
    { role: "orgAdmin", action: "navigate", target: "/en/org/members", description: "Go to members list" },
    { role: "orgAdmin", action: "waitFor", target: `text=${users.invitee.name}`, description: "See new member in list" },
    { role: "orgAdmin", pause: 2000 },
    { role: "invitee", pause: 2000 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = {
  searchAndInviteUser,
  acceptInvitation,
};
```

- [ ] **Step 2: Commit**

```bash
git add e2e-demo/flows/06-member-management.flow.ts
git commit -m "feat(e2e-demo): add flow 06 — member management (side-by-side)"
```

---

### Task 15: Integration — Smoke Test the Full Pipeline

**Files:**
- No new files — validation only

- [ ] **Step 1: Run unit tests**

Run:
```bash
npx vitest run e2e-demo/runner/__tests__/
```

Expected: All tests in sync.test.ts and actions.test.ts pass.

- [ ] **Step 2: Verify TypeScript compilation**

Run:
```bash
npx tsx --eval "import('./e2e-demo/runner/engine.js').then(() => console.log('Engine imports OK'))"
```

Expected: No type errors, prints "Engine imports OK"

- [ ] **Step 3: Dry-run a single flow (requires running app)**

Run:
```bash
npm run demo:record -- --flow 01
```

Expected: Flow 01 executes, produces `e2e-demo/recordings/01-registration/user.webm`. If the app isn't running or seed data doesn't match, the error should be clear and actionable.

- [ ] **Step 4: Final commit with any fixes**

```bash
git add -A
git commit -m "chore(e2e-demo): integration fixes after smoke test"
```
