import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "../client";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prepends base URL to relative paths", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
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
