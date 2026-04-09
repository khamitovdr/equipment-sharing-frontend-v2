import path from "node:path";
import type { Page } from "@playwright/test";
import type { ActionHandler, ActionContext } from "./types.js";

const RECORDINGS_DIR = path.resolve(import.meta.dirname, "../recordings");

/** Default human-pacing delay: 300ms center +/-150ms jitter */
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
  } else if (target === "top" || target === "body") {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
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
  await page.screenshot({ path: path.join(RECORDINGS_DIR, `${name}.png`) });
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
