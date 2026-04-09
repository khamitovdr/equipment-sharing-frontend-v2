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
        () =>
          reject(
            new Error(
              `Sync barrier "${name}" timed out waiting for roles: ${this.roles.filter((r) => !barrier.arrived.has(r)).join(", ")}`,
            ),
        ),
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
