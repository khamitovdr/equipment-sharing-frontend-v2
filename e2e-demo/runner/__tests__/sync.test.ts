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
