import { describe, it, expect } from "vitest";
import { generateTraceparent } from "../trace";

describe("generateTraceparent", () => {
  it("returns a 32-hex traceId", () => {
    const { traceId } = generateTraceparent();
    expect(traceId).toMatch(/^[0-9a-f]{32}$/);
  });

  it("returns a 16-hex spanId", () => {
    const { spanId } = generateTraceparent();
    expect(spanId).toMatch(/^[0-9a-f]{16}$/);
  });

  it("returns a W3C-formatted traceparent with sampled flag", () => {
    const { traceparent } = generateTraceparent();
    expect(traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it("traceparent contains the same traceId and spanId it returns", () => {
    const { traceId, spanId, traceparent } = generateTraceparent();
    expect(traceparent).toBe(`00-${traceId}-${spanId}-01`);
  });

  it("produces different trace IDs across calls", () => {
    const a = generateTraceparent();
    const b = generateTraceparent();
    expect(a.traceId).not.toBe(b.traceId);
    expect(a.spanId).not.toBe(b.spanId);
  });
});
