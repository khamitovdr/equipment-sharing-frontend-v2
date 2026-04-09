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
