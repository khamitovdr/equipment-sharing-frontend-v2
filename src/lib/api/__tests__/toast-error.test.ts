import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiRequestError } from "../client";
import { toastApiError } from "../toast-error";

const errorMock = vi.fn();
const successMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => errorMock(...args),
    success: (...args: unknown[]) => successMock(...args),
  },
}));

describe("toastApiError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const labels = {
    traceIdLabel: "ID",
    copyTraceId: "Copy",
    traceIdCopied: "Trace ID copied",
  };

  it("shows title + description + copy action when traceId is present", () => {
    const err = new ApiRequestError(500, "boom", "4bf92f3577b34da6a3ce929d0e0e4736");
    toastApiError(err, "fallback", labels);

    expect(errorMock).toHaveBeenCalledTimes(1);
    const [title, opts] = errorMock.mock.calls[0] as [string, { description: string; action: { label: string; onClick: () => void } }];
    expect(title).toBe("boom");
    expect(opts.description).toContain("4bf92f35");
    expect(opts.action).toBeDefined();
    expect(opts.action.label).toBeTruthy();
    expect(typeof opts.action.onClick).toBe("function");
  });

  it("shows title only when traceId is null", () => {
    const err = new ApiRequestError(500, "boom", null);
    toastApiError(err, "fallback");

    expect(errorMock).toHaveBeenCalledTimes(1);
    const [title, opts] = errorMock.mock.calls[0] as [string, undefined];
    expect(title).toBe("boom");
    expect(opts).toBeUndefined();
  });

  it("uses fallback text when detail is not a string", () => {
    const err = new ApiRequestError(500, { code: "x" }, "a".repeat(32));
    toastApiError(err, "fallback");

    const [title] = errorMock.mock.calls[0];
    expect(title).toBe("fallback");
  });

  it("shows fallback only for non-ApiRequestError", () => {
    toastApiError(new Error("something"), "fallback");

    expect(errorMock).toHaveBeenCalledTimes(1);
    const [title, opts] = errorMock.mock.calls[0];
    expect(title).toBe("fallback");
    expect(opts).toBeUndefined();
  });

  it("copy action writes full trace ID to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
    const err = new ApiRequestError(500, "boom", traceId);
    toastApiError(err, "fallback", labels);

    const [, opts] = errorMock.mock.calls[0] as [string, { action: { onClick: () => void } }];
    opts.action.onClick();

    expect(writeText).toHaveBeenCalledWith(traceId);
  });

  it("omits description when labels are not provided even if traceId is present", () => {
    const err = new ApiRequestError(500, "boom", "a".repeat(32));
    toastApiError(err, "fallback");
    const [title, opts] = errorMock.mock.calls[0];
    expect(title).toBe("boom");
    expect(opts).toBeUndefined();
  });
});
