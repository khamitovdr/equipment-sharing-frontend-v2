# Frontend Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Link browser-originated API requests to backend OpenTelemetry traces by injecting `traceparent` on outgoing requests, surfacing the returned `X-Trace-Id` in error toasts, and emitting OpenReplay events for each failed request.

**Architecture:** Manual W3C `traceparent` injection in the single `apiClient` chokepoint — no OTel SDK on the browser. `ApiRequestError` carries the trace ID. A new `toastApiError(err, fallback)` helper renders it as a copyable second line. A thin `trackApiError(...)` wrapper over `@openreplay/tracker` emits `api_error` events in production so support can pivot from OpenReplay session → Grafana trace.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Vitest + jsdom, `sonner`, `@openreplay/tracker`, `next-intl`.

**Spec:** `docs/superpowers/specs/2026-04-20-frontend-observability-design.md`

---

## File Map

**Create:**
- `src/lib/observability/trace.ts` — `generateTraceparent()` helper
- `src/lib/observability/__tests__/trace.test.ts`
- `src/lib/observability/openreplay-events.ts` — `trackApiError()` wrapper
- `src/lib/observability/__tests__/openreplay-events.test.ts`
- `src/lib/api/toast-error.ts` — `toastApiError()` helper
- `src/lib/api/__tests__/toast-error.test.ts`

**Modify:**
- `src/lib/api/client.ts` — inject `traceparent`, read `X-Trace-Id`, extend `ApiRequestError`, call `trackApiError` on error
- `src/lib/api/index.ts` — re-export `toastApiError`
- `src/lib/api/__tests__/client.test.ts` — update mocks to supply `Headers`; add trace-ID tests
- `src/lib/i18n/messages/ru.json` — add `errors.traceIdLabel`, `errors.copyTraceId`, `errors.traceIdCopied`
- `src/lib/i18n/messages/en.json` — same keys, English text
- ~20 call sites that currently do `toast.error(...)` in an API `catch` — migrate to `toastApiError(err, fallback)` (enumerated in Task 7)

---

## Task 1: `generateTraceparent()` helper + tests

**Files:**
- Create: `src/lib/observability/trace.ts`
- Create: `src/lib/observability/__tests__/trace.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/observability/__tests__/trace.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm run test:run -- src/lib/observability/__tests__/trace.test.ts`
Expected: FAIL with `Cannot find module '../trace'`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/observability/trace.ts`:

```ts
export interface Traceparent {
  traceId: string;
  spanId: string;
  traceparent: string;
}

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    out += buf[i].toString(16).padStart(2, "0");
  }
  return out;
}

export function generateTraceparent(): Traceparent {
  const traceId = randomHex(16);
  const spanId = randomHex(8);
  return {
    traceId,
    spanId,
    traceparent: `00-${traceId}-${spanId}-01`,
  };
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm run test:run -- src/lib/observability/__tests__/trace.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/observability/trace.ts src/lib/observability/__tests__/trace.test.ts
git commit -m "feat(observability): add W3C traceparent generator"
```

---

## Task 2: `trackApiError()` OpenReplay wrapper + test

**Files:**
- Create: `src/lib/observability/openreplay-events.ts`
- Create: `src/lib/observability/__tests__/openreplay-events.test.ts`

Context: `@openreplay/tracker` exposes a default-exported singleton `tracker`. It has a `tracker.event(name, payload)` method. When `tracker.start()` has not been called, calling `tracker.event(...)` is safe (internal no-op), but to be defensive we also guard by checking a module-level flag we control.

- [ ] **Step 1: Write the failing test**

Create `src/lib/observability/__tests__/openreplay-events.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm run test:run -- src/lib/observability/__tests__/openreplay-events.test.ts`
Expected: FAIL with `Cannot find module '../openreplay-events'`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/observability/openreplay-events.ts`:

```ts
import { tracker } from "@openreplay/tracker";

let started = false;

export function markTrackerStarted(): void {
  started = true;
}

export interface ApiErrorInfo {
  traceId: string;
  status: number;
  path: string;
  method: string;
}

export function trackApiError(info: ApiErrorInfo): void {
  if (!started) return;
  try {
    tracker.event("api_error", info);
  } catch {
    // tracker in an invalid state (session not started, SSR, etc.) — swallow
  }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm run test:run -- src/lib/observability/__tests__/openreplay-events.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire `markTrackerStarted` into the OpenReplay component**

Modify `src/components/openreplay.tsx` — import `markTrackerStarted` and call it right after `tracker.start()`:

```tsx
"use client";

import { useEffect } from "react";
import { markTrackerStarted } from "@/lib/observability/openreplay-events";

const projectKey = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY;
const enabled = process.env.NODE_ENV === "production" && !!projectKey;

export default function OpenReplay() {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const { tracker } = await import("@openreplay/tracker");
      if (cancelled) return;
      tracker.configure({ projectKey: projectKey! });
      tracker.start();
      markTrackerStarted();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
```

- [ ] **Step 6: Re-run all observability tests**

Run: `npm run test:run -- src/lib/observability`
Expected: PASS (7 tests total).

- [ ] **Step 7: Commit**

```bash
git add src/lib/observability/openreplay-events.ts src/lib/observability/__tests__/openreplay-events.test.ts src/components/openreplay.tsx
git commit -m "feat(observability): add trackApiError OpenReplay wrapper"
```

---

## Task 3: Extend `ApiRequestError` with `traceId`

**Files:**
- Modify: `src/lib/api/client.ts`
- Modify: `src/lib/api/__tests__/client.test.ts`

This task adds the field and keeps existing behavior. The next task wires injection and reading.

- [ ] **Step 1: Update `ApiRequestError` constructor**

In `src/lib/api/client.ts`, replace the `ApiRequestError` class definition (currently at line 13):

```ts
export class ApiRequestError extends Error {
  status: number;
  detail: string | unknown;
  traceId: string | null;

  constructor(status: number, detail: string | unknown, traceId: string | null = null) {
    super(typeof detail === "string" ? detail : "API Error");
    this.status = status;
    this.detail = detail;
    this.traceId = traceId;
  }
}
```

The third argument defaults to `null` so existing call sites that construct `new ApiRequestError(status, detail)` still compile.

- [ ] **Step 2: Run existing client tests**

Run: `npm run test:run -- src/lib/api/__tests__/client.test.ts`
Expected: PASS (4 tests). The existing `toMatchObject({ status: 400, detail: "Bad request" })` assertion still holds since `toMatchObject` allows extra properties.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/client.ts
git commit -m "feat(api): add traceId field to ApiRequestError"
```

---

## Task 4: Inject `traceparent` and read `X-Trace-Id` in `apiClient`

**Files:**
- Modify: `src/lib/api/client.ts`
- Modify: `src/lib/api/__tests__/client.test.ts`

- [ ] **Step 1: Update existing test mocks to provide `Headers`**

The existing tests mock `fetch` with plain objects that lack a `headers` property. The new code reads `response.headers.get("X-Trace-Id")`, so every mock response must now include `headers: new Headers()`.

In `src/lib/api/__tests__/client.test.ts`, update all four existing `mockFetch.mockResolvedValueOnce(...)` calls to include `headers`:

```ts
mockFetch.mockResolvedValueOnce({
  ok: true,
  status: 200,
  headers: new Headers(),
  json: () => Promise.resolve({ data: "test" }),
});
```

Apply the same `headers: new Headers()` addition to the three other existing mocks in the file. For the error-case mock (the third test), use `headers: new Headers({ "X-Trace-Id": "a".repeat(32) })`.

- [ ] **Step 2: Write new failing tests for trace-ID behavior**

Append to `src/lib/api/__tests__/client.test.ts`:

```ts
import { trackApiError } from "@/lib/observability/openreplay-events";

vi.mock("@/lib/observability/openreplay-events", () => ({
  trackApiError: vi.fn(),
  markTrackerStarted: vi.fn(),
}));

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
```

- [ ] **Step 3: Run the tests and verify they fail**

Run: `npm run test:run -- src/lib/api/__tests__/client.test.ts`
Expected: The four pre-existing tests pass (headers are now provided); the five new tests FAIL — `traceparent` not set, `traceId` not on error, no `trackApiError` calls, fetch rejection bubbles un-wrapped.

- [ ] **Step 4: Implement trace injection in `apiClient`**

In `src/lib/api/client.ts`, replace the body of `apiClient` (the part from the `fetch(...)` call through the end of the function) with:

```ts
  const { traceId: localTraceId, traceparent } = generateTraceparent();
  headers.set("traceparent", traceparent);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError(0, "network", null);
  }

  const serverTraceId = response.headers.get("X-Trace-Id") ?? localTraceId;

  if (!response.ok) {
    let detail: unknown;
    try {
      const json = await response.json();
      detail = json.detail ?? json;
    } catch {
      detail = response.statusText;
    }

    if (response.status === 401 && typeof window !== "undefined" && token && !skipAuthRedirect) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }

    trackApiError({
      traceId: serverTraceId,
      status: response.status,
      path,
      method,
    });

    throw new ApiRequestError(response.status, detail, serverTraceId);
  }

  if (response.status === 204 || response.headers?.get?.("content-length") === "0") {
    return undefined as T;
  }

  return response.json() as Promise<T>;
```

Add the imports at the top of the file, alongside the existing import:

```ts
import { useAuthStore } from "@/lib/stores/auth-store";
import { generateTraceparent } from "@/lib/observability/trace";
import { trackApiError } from "@/lib/observability/openreplay-events";
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `npm run test:run -- src/lib/api/__tests__/client.test.ts`
Expected: PASS (9 tests total — 4 pre-existing + 5 new).

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/client.ts src/lib/api/__tests__/client.test.ts
git commit -m "feat(api): inject traceparent and surface X-Trace-Id on errors"
```

---

## Task 5: `toastApiError()` helper + tests

**Files:**
- Create: `src/lib/api/toast-error.ts`
- Create: `src/lib/api/__tests__/toast-error.test.ts`
- Modify: `src/lib/api/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/api/__tests__/toast-error.test.ts`:

```ts
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

  it("shows title + description + copy action when traceId is present", () => {
    const err = new ApiRequestError(500, "boom", "4bf92f3577b34da6a3ce929d0e0e4736");
    toastApiError(err, "fallback");

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
    toastApiError(err, "fallback");

    const [, opts] = errorMock.mock.calls[0] as [string, { action: { onClick: () => void } }];
    opts.action.onClick();

    expect(writeText).toHaveBeenCalledWith(traceId);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm run test:run -- src/lib/api/__tests__/toast-error.test.ts`
Expected: FAIL with `Cannot find module '../toast-error'`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/api/toast-error.ts`:

```ts
import { toast } from "sonner";
import { ApiRequestError } from "./client";

export function toastApiError(err: unknown, fallback: string): void {
  if (!(err instanceof ApiRequestError)) {
    toast.error(fallback);
    return;
  }

  const title = typeof err.detail === "string" ? err.detail : fallback;

  if (!err.traceId) {
    toast.error(title);
    return;
  }

  const fullTraceId = err.traceId;
  const shortTraceId = fullTraceId.slice(0, 8);

  toast.error(title, {
    description: `ID: ${shortTraceId}…`,
    action: {
      label: "Copy",
      onClick: () => {
        void navigator.clipboard.writeText(fullTraceId).then(() => {
          toast.success("Trace ID copied");
        });
      },
    },
  });
}
```

Note: the `"Copy"` and `"Trace ID copied"` strings are hardcoded in this step to keep the module non-React. Task 6 replaces them with i18n-aware versions by accepting labels as a second parameter.

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm run test:run -- src/lib/api/__tests__/toast-error.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Re-export from api barrel**

Modify `src/lib/api/index.ts` — add `toastApiError` to the exports. Read the file first to see its current shape, then add:

```ts
export { toastApiError } from "./toast-error";
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/toast-error.ts src/lib/api/__tests__/toast-error.test.ts src/lib/api/index.ts
git commit -m "feat(api): add toastApiError helper for trace-ID-aware error toasts"
```

---

## Task 6: Internationalize the toast helper

**Files:**
- Modify: `src/lib/i18n/messages/ru.json`
- Modify: `src/lib/i18n/messages/en.json`
- Modify: `src/lib/api/toast-error.ts`
- Modify: `src/lib/api/__tests__/toast-error.test.ts`

The helper must not import `useTranslations` (it isn't a React hook). Instead, it takes the already-translated labels as a second argument.

- [ ] **Step 1: Add keys to `ru.json`**

Modify `src/lib/i18n/messages/ru.json`. Locate the existing `"errors"` object (around line 171) and extend it:

```json
  "errors": {
    "networkError": "Ошибка сети",
    "forbidden": "У вас нет доступа",
    "serverError": "Сервис временно недоступен, попробуйте позже",
    "traceIdLabel": "ID",
    "copyTraceId": "Скопировать",
    "traceIdCopied": "ID скопирован"
  },
```

- [ ] **Step 2: Add keys to `en.json`**

Modify `src/lib/i18n/messages/en.json`. Locate the existing `"errors"` object and extend it with:

```json
    "traceIdLabel": "ID",
    "copyTraceId": "Copy",
    "traceIdCopied": "Trace ID copied"
```

(Preserve existing keys; add these three alongside them.)

- [ ] **Step 3: Update `toastApiError` to accept labels**

Replace the body of `src/lib/api/toast-error.ts` with:

```ts
import { toast } from "sonner";
import { ApiRequestError } from "./client";

export interface ToastApiErrorLabels {
  traceIdLabel: string;
  copyTraceId: string;
  traceIdCopied: string;
}

export function toastApiError(
  err: unknown,
  fallback: string,
  labels?: ToastApiErrorLabels
): void {
  if (!(err instanceof ApiRequestError)) {
    toast.error(fallback);
    return;
  }

  const title = typeof err.detail === "string" ? err.detail : fallback;

  if (!err.traceId || !labels) {
    toast.error(title);
    return;
  }

  const fullTraceId = err.traceId;
  const shortTraceId = fullTraceId.slice(0, 8);

  toast.error(title, {
    description: `${labels.traceIdLabel}: ${shortTraceId}…`,
    action: {
      label: labels.copyTraceId,
      onClick: () => {
        void navigator.clipboard.writeText(fullTraceId).then(() => {
          toast.success(labels.traceIdCopied);
        });
      },
    },
  });
}
```

`labels` is optional; when omitted (e.g. server-side) the helper degrades to a plain error toast. This keeps the helper usable from non-component code paths.

- [ ] **Step 4: Update tests to pass labels**

In `src/lib/api/__tests__/toast-error.test.ts`, update the two tests that exercise the trace-ID path so they pass labels:

```ts
const labels = {
  traceIdLabel: "ID",
  copyTraceId: "Copy",
  traceIdCopied: "Trace ID copied",
};
```

Use `toastApiError(err, "fallback", labels)` in the "shows title + description + copy action when traceId is present" test and the "copy action writes full trace ID to clipboard" test.

Add one new test:

```ts
it("omits description when labels are not provided even if traceId is present", () => {
  const err = new ApiRequestError(500, "boom", "a".repeat(32));
  toastApiError(err, "fallback");
  const [title, opts] = errorMock.mock.calls[0];
  expect(title).toBe("boom");
  expect(opts).toBeUndefined();
});
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `npm run test:run -- src/lib/api/__tests__/toast-error.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/i18n/messages/ru.json src/lib/i18n/messages/en.json src/lib/api/toast-error.ts src/lib/api/__tests__/toast-error.test.ts
git commit -m "feat(api): i18n labels for trace-ID error toasts"
```

---

## Task 7: Migrate error-toast call sites

**Goal:** Replace every generic `toast.error(t("common.error"))` style call inside an API `catch` with `toastApiError(err, t("common.error"), labels)`. Bespoke status-specific branches (e.g. `if (err.status === 409) ...`) keep their specific branches; only the generic fallback arm changes.

Each call site is client code (`"use client"`) and has access to `useTranslations` from `next-intl`. The pattern at every site:

```tsx
const t = useTranslations();
const traceLabels = {
  traceIdLabel: t("errors.traceIdLabel"),
  copyTraceId: t("errors.copyTraceId"),
  traceIdCopied: t("errors.traceIdCopied"),
};

// inside catch
toastApiError(err, t("common.error"), traceLabels);
```

To avoid repeating the `traceLabels` object at every site, factor out a tiny hook.

- [ ] **Step 1: Create `useApiErrorToast` hook**

Create `src/lib/hooks/use-api-error-toast.ts`:

```ts
"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toastApiError } from "@/lib/api/toast-error";

export function useApiErrorToast() {
  const t = useTranslations();
  return useCallback(
    (err: unknown, fallback?: string) => {
      toastApiError(err, fallback ?? t("common.error"), {
        traceIdLabel: t("errors.traceIdLabel"),
        copyTraceId: t("errors.copyTraceId"),
        traceIdCopied: t("errors.traceIdCopied"),
      });
    },
    [t]
  );
}
```

Call-site usage becomes:

```tsx
const toastError = useApiErrorToast();
// ...
catch (err) {
  toastError(err);
}
```

- [ ] **Step 2: Write a test for the hook**

Create `src/lib/hooks/__tests__/use-api-error-toast.test.tsx`:

```tsx
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
```

- [ ] **Step 3: Run test, verify it fails, then verify it passes after step 1**

Run: `npm run test:run -- src/lib/hooks/__tests__/use-api-error-toast.test.tsx`
Expected: PASS (1 test) — the hook already exists from step 1; this step verifies end-to-end wiring through `next-intl`.

- [ ] **Step 4: Commit hook**

```bash
git add src/lib/hooks/use-api-error-toast.ts src/lib/hooks/__tests__/use-api-error-toast.test.tsx
git commit -m "feat: useApiErrorToast hook wiring i18n + trace-ID toasts"
```

- [ ] **Step 5: Migrate call sites**

Re-run this grep to produce an up-to-date list at migration time:

```bash
rg -l "toast\.error" src --glob '!**/*.test.*' --glob '!**/ui/sonner.tsx'
```

For each file in the list that calls `toast.error` from inside a `catch` block of an API call, apply this transformation:

**Before:**
```tsx
import { toast } from "sonner";
// ...
try {
  await mutateAsync(values);
} catch (err) {
  toast.error(t("common.error"));
}
```

**After:**
```tsx
import { toast } from "sonner"; // keep if used elsewhere; remove if not
import { useApiErrorToast } from "@/lib/hooks/use-api-error-toast";
// ...
const toastError = useApiErrorToast();
// ...
try {
  await mutateAsync(values);
} catch (err) {
  toastError(err);
}
```

Rules for this migration:

1. **Only replace generic `toast.error` calls** that are reacting to an API failure (inside a `catch`, or in a React Query `onError`). Leave UI-only toasts (validation, user-intent errors like "phone number invalid") alone.
2. **Bespoke status branches stay.** For example `src/app/[locale]/(public)/organizations/new/page.tsx:152` (`err.status === 409 → "already exists"`) keeps the 409 branch and replaces only the generic `else` arm.
3. **React Query `onError`:** the error is passed as the first argument. Update the callback:
   ```ts
   onError: (err) => toastError(err),
   ```
4. **Remove unused `toast` imports** after the change.

Concrete starting list (re-verify with the grep in case the codebase moved on):

- `src/app/[locale]/(auth)/login/page.tsx`
- `src/app/[locale]/(auth)/register/page.tsx`
- `src/app/[locale]/(public)/organizations/new/page.tsx`
- `src/app/[locale]/(public)/orders/[id]/page.tsx`
- `src/app/[locale]/(dashboard)/org/listings/page.tsx`
- `src/app/[locale]/(dashboard)/org/listings/new/page.tsx`
- `src/app/[locale]/(dashboard)/org/listings/[id]/page.tsx`
- `src/app/[locale]/(dashboard)/org/listings/[id]/edit/page.tsx`
- `src/app/[locale]/(dashboard)/org/orders/[id]/page.tsx`
- `src/app/[locale]/(dashboard)/org/settings/page.tsx`
- `src/app/[locale]/(dashboard)/org/members/invite/page.tsx`
- `src/components/catalog/order-form.tsx`
- `src/components/chat/chat-input.tsx` (only the generic fallback branches — `uploadTimeout`/`uploadFailed` are domain-specific, leave them; any generic `t("common.error")` is a candidate)
- `src/components/org/member-table.tsx`
- `src/components/org/join-org-dialog.tsx`
- `src/components/org/photo-grid.tsx`
- `src/components/settings/profile-form.tsx` (keep the 409 branch)
- `src/components/settings/password-form.tsx` (keep the specific-status branch)
- `src/components/settings/avatar-section.tsx`
- `src/lib/hooks/use-chat.ts` — **skip**: these toasts use `frame.data.detail` from a chat WebSocket, not an API error. Leave as-is.
- `src/lib/hooks/use-org-guard.ts` — **skip**: this is a permission redirect toast, not an API error.

- [ ] **Step 6: Type-check and run full test suite**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run test:run`
Expected: PASS (all existing tests + the new observability and toast-error tests).

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 8: Commit migration**

```bash
git add -A
git commit -m "refactor: migrate API error toasts to toastApiError"
```

---

## Task 8: Manual verification in dev

Not a code task — a checklist the implementer runs before marking the work done.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Confirm `traceparent` on outgoing requests**

Open DevTools → Network. Trigger any page that loads from `/api/v1/*`. Click a request. In Request Headers, confirm a `traceparent` header is present and matches `00-<32 hex>-<16 hex>-01`.

- [ ] **Step 3: Confirm `X-Trace-Id` on responses**

Same request. Response Headers include `X-Trace-Id` with a 32-hex value. It should equal the trace portion of the `traceparent` you sent.

- [ ] **Step 4: Trigger an error and confirm toast**

Easiest path: open the catalog, submit an order with invalid data, or disconnect the network and retry a mutation. Confirm the toast shows:
- A title (either the server's `detail` string or `t("common.error")`).
- A second muted line `ID: <8 hex>…`.
- A "Copy" (or "Скопировать") action.

Click Copy. A secondary toast confirms. Paste elsewhere — you should get 32 hex characters.

- [ ] **Step 5: Confirm network-failure path**

In DevTools, set "Network: Offline". Trigger a mutation. Confirm the toast shows only the fallback title, no ID line.

- [ ] **Step 6: Note OpenReplay verification**

OpenReplay is production-only (`NODE_ENV === "production" && NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY`). Local dev cannot verify `trackApiError`. After deploy to production: trigger a known error, open the corresponding session in OpenReplay, confirm an `api_error` event appears on the timeline with the trace ID, and paste that trace ID into Grafana to confirm resolution.

---

## Self-Review Notes

- **Spec coverage:** all spec sections mapped to tasks — trace helper (Task 1), OpenReplay wrapper (Task 2), `ApiRequestError.traceId` (Task 3), `apiClient` injection + `X-Trace-Id` read (Task 4), toast helper (Task 5), i18n (Task 6), call-site migration (Task 7), manual verification (Task 8).
- **Types consistent:** `ApiRequestError` constructor signature `(status, detail, traceId)` matches across Tasks 3, 4, 5, 7. `ApiErrorInfo` / `trackApiError` payload shape matches between Task 2's test and Task 4's call site. `ToastApiErrorLabels` key names (`traceIdLabel`, `copyTraceId`, `traceIdCopied`) match between Task 6's JSON, Task 6's helper, and Task 7's hook.
- **No placeholders:** every step has the actual content to write or the exact command to run.
