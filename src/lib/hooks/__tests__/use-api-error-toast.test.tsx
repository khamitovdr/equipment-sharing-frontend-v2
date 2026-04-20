import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useApiErrorToast } from "../use-api-error-toast";
import { ApiRequestError } from "@/lib/api/client";

const errorMock = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => errorMock(...args), success: vi.fn() },
}));

const messages = {
  common: { error: "Произошла ошибка" },
  errors: { traceIdLabel: "ID", copyTraceId: "Скопировать", traceIdCopied: "ID скопирован" },
};

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="ru" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe("useApiErrorToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes translated labels and fallback to toastApiError", () => {
    const { result } = renderHook(() => useApiErrorToast(), { wrapper });
    const err = new ApiRequestError(500, "server boom", "a".repeat(32));
    result.current(err);

    expect(errorMock).toHaveBeenCalledTimes(1);
    const [title, opts] = errorMock.mock.calls[0];
    expect(title).toBe("server boom");
    expect(opts.description).toMatch(/^ID: [0-9a-f]{8}…$/);
    expect(opts.action.label).toBe("Скопировать");
  });
});
