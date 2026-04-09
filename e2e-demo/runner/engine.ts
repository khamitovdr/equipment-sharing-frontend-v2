import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import config from "../playwright.config.js";
import { SyncCoordinator } from "./sync.js";
import { ActionRegistry } from "./actions.js";
import { saveRecording, type RecordingResult } from "./recorder.js";
import { login } from "../helpers/auth.js";
import { injectCursor } from "../helpers/cursor.js";
import {
  type FlowDefinition,
  type Step,
  type ActionHandler,
  isActionStep,
  isSyncPoint,
  isPauseStep,
} from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECORDINGS_DIR = path.resolve(__dirname, "../recordings");

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
          dir: path.join(RECORDINGS_DIR, `.tmp-${flow.name}`),
          size: viewport,
        },
        baseURL,
      });
      const page = await context.newPage();
      await injectCursor(page);

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
            await page.screenshot({ path: path.join(RECORDINGS_DIR, `${name}.png`) }).catch(() => {});
            errors.push(error);
            break; // Stop this role's track
          }
        }
      }),
    );

    // Save recordings — close contexts first to finalize videos, then rename
    const results: RecordingResult[] = [];
    for (const role of activeRoles) {
      const { context, page } = contexts.get(role)!;
      await context.close();
      try {
        const result = await saveRecording(page, flow.name, role);
        results.push(result);
        console.log(`  [${role}] 🎬 saved → ${result.path}`);
      } catch (err) {
        console.error(`  [${role}] ⚠️  failed to save recording: ${err}`);
      }
    }

    await browser.close();

    if (errors.length > 0) {
      console.error(`\n⚠️  Flow "${flow.name}" completed with ${errors.length} error(s)`);
    }

    return results;
  }
}
