import { describe, it, expect, vi, beforeEach } from "vitest";

const eventMock = vi.fn();

vi.mock("@openreplay/tracker", () => ({
  tracker: {
    event: eventMock,
    start: vi.fn(),
    configure: vi.fn(),
  },
}));

describe("trackApiError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("does nothing when the tracker has not been marked started", async () => {
    const { trackApiError } = await import("../openreplay-events");
    trackApiError({ traceId: "abc", status: 500, path: "/x", method: "GET" });
    expect(eventMock).not.toHaveBeenCalled();
  });

  it("emits api_error event once markTrackerStarted has been called", async () => {
    const mod = await import("../openreplay-events");
    mod.markTrackerStarted();
    mod.trackApiError({
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      status: 500,
      path: "/listings",
      method: "POST",
    });
    expect(eventMock).toHaveBeenCalledTimes(1);
    expect(eventMock).toHaveBeenCalledWith("api_error", {
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      status: 500,
      path: "/listings",
      method: "POST",
    });
  });
});
