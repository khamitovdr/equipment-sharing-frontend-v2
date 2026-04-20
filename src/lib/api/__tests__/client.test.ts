import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "../client";
import { trackApiError } from "@/lib/observability/openreplay-events";

vi.mock("@/lib/observability/openreplay-events", () => ({
  trackApiError: vi.fn(),
  markTrackerStarted: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prepends base URL to relative paths", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ data: "test" }),
    });

    await apiClient("/users/me");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/users/me"),
      expect.any(Object)
    );
  });

  it("attaches Authorization header when token provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({}),
    });

    await apiClient("/users/me", { token: "test-jwt" });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get("Authorization")).toBe("Bearer test-jwt");
  });

  it("throws on non-ok response with parsed error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers({ "X-Trace-Id": "a".repeat(32) }),
      json: () => Promise.resolve({ detail: "Bad request" }),
    });

    await expect(apiClient("/test")).rejects.toMatchObject({
      status: 400,
      detail: "Bad request",
    });
  });

  it("builds query string from params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({}),
    });

    await apiClient("/listings", {
      params: { search: "excavator", limit: 10, empty: null },
    });

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("search=excavator");
    expect(url).toContain("limit=10");
    expect(url).not.toContain("empty");
  });
});

describe("apiClient trace propagation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a W3C traceparent header on every request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({}),
    });

    await apiClient("/test");

    const [, options] = mockFetch.mock.calls[0];
    const traceparent = options.headers.get("traceparent");
    expect(traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it("attaches server-returned trace ID to ApiRequestError on non-ok", async () => {
    const serverTraceId = "deadbeefdeadbeefdeadbeefdeadbeef";
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({ "X-Trace-Id": serverTraceId }),
      json: () => Promise.resolve({ detail: "boom" }),
    });

    await expect(apiClient("/test")).rejects.toMatchObject({
      status: 500,
      detail: "boom",
      traceId: serverTraceId,
    });

    expect(trackApiError).toHaveBeenCalledWith({
      traceId: serverTraceId,
      status: 500,
      path: "/test",
      method: "GET",
    });
  });

  it("falls back to locally generated trace ID when response lacks X-Trace-Id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: () => Promise.resolve({ detail: "boom" }),
    });

    try {
      await apiClient("/test");
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toMatchObject({ status: 500 });
      expect((err as { traceId: string }).traceId).toMatch(/^[0-9a-f]{32}$/);
    }
    expect(trackApiError).toHaveBeenCalledTimes(1);
  });

  it("wraps fetch rejection as ApiRequestError(0, 'network', null)", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(apiClient("/test")).rejects.toMatchObject({
      status: 0,
      detail: "network",
      traceId: null,
    });

    expect(trackApiError).not.toHaveBeenCalled();
  });

  it("does not call trackApiError on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "X-Trace-Id": "a".repeat(32) }),
      json: () => Promise.resolve({}),
    });

    await apiClient("/test");
    expect(trackApiError).not.toHaveBeenCalled();
  });
});
