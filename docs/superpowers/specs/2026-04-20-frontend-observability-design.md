# Frontend Observability — Design

**Date:** 2026-04-20
**Status:** Approved for planning
**Scope:** Single-iteration feature; no follow-up phases planned in this spec.

## Goal

Link browser-originated API requests to backend OpenTelemetry traces so support engineers can jump from a user-reported error (or an OpenReplay session) straight to the corresponding Grafana trace.

Backend contract (authoritative — `/Users/khamitovdr/equipment-sharing-frontend-v2/docs` does not currently carry it; see the user-supplied brief in conversation):

- Backend **always** returns `X-Trace-Id` — 32 lowercase hex chars — on every response. Header is already on the backend's CORS `expose_headers`.
- If the request carries a W3C `traceparent`, the backend continues that trace and echoes the same trace ID back. Otherwise the backend starts a new trace.

## Non-Goals

- **No browser span export.** We do not run `@opentelemetry/sdk-trace-web` and do not send OTLP. Grafana will still show backend-rooted spans; the browser simply owns the trace ID. If browser-side spans ever become valuable, the design adds an SDK later without touching call sites.
- **No server-side apiClient changes beyond isomorphic reuse.** SSR requests get a `traceparent` for free because the same `apiClient` runs in both contexts.
- **No sampling logic.** Every request is marked sampled (`01`). The backend controls sampling.
- **No changes to the Next.js CORS proxy** (`src/app/api/v1/[...path]/route.ts`). It already forwards all request and response headers verbatim.

## Architecture

Two new observability modules plus targeted edits to the existing `apiClient` and a new shared toast helper. All client-side code funnels through `apiClient`, so trace propagation and error-to-toast plumbing only need to be added in one place.

### `src/lib/observability/trace.ts`

Pure helpers. No DOM or React dependencies.

```ts
export function generateTraceparent(): {
  traceId: string;   // 32 lowercase hex
  spanId: string;    // 16 lowercase hex
  traceparent: string; // "00-<traceId>-<spanId>-01"
};
```

Uses `crypto.getRandomValues`. Sampled flag is always `01`.

### `src/lib/observability/openreplay-events.ts`

Thin wrapper over `@openreplay/tracker`.

```ts
export function trackApiError(info: {
  traceId: string;
  status: number;
  path: string;
  method: string;
}): void;
```

No-op when the tracker has not been started (dev, SSR, or production without `NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY`). Decouples call sites from OpenReplay's shape.

### `src/lib/api/client.ts` (modified)

- Before each `fetch`, call `generateTraceparent()` and set the `traceparent` header.
- After the response, read `const serverTraceId = response.headers.get("X-Trace-Id") ?? generatedTraceId`.
- On success: discard the trace ID. Do not log it.
- On non-ok: construct `new ApiRequestError(status, detail, serverTraceId)`, call `trackApiError({ traceId: serverTraceId, status, path, method })`, throw.
- On `fetch` rejection (network failure, CORS reject, offline): throw `new ApiRequestError(0, "network", null)`. Do not call `trackApiError` — we have no server-confirmed ID.

### Error surface

`ApiRequestError` gains one field:

```ts
class ApiRequestError extends Error {
  status: number;
  detail: string | unknown;
  traceId: string | null;
  constructor(status: number, detail: string | unknown, traceId: string | null);
}
```

New helper `src/lib/api/toast-error.ts`:

```ts
export function toastApiError(err: unknown, fallback: string): void;
```

- `ApiRequestError` with `traceId`: `toast.error(title, { description, action })` where `description` shows a monospaced, muted `ID: <first 8 hex>…` line, and `action` is "Copy" which copies the full 32-hex ID to clipboard. On copy, show a secondary toast using `errors.traceIdCopied`.
- `ApiRequestError` without `traceId`: `toast.error(title)` with no description.
- Non-`ApiRequestError`: `toast.error(fallback)` with no description.

`title` text: use `err.detail` when it is a string, otherwise `fallback`. This matches current behavior of most call sites.

### i18n

New keys added to both locale files (`src/lib/i18n/messages/ru.json` and `src/lib/i18n/messages/en.json`):

- `errors.traceIdLabel` — `"ID"` (displayed as `"ID: 4bf92f35…"`).
- `errors.copyTraceId` — `"Copy"` action label (ru: `"Скопировать"`, en: `"Copy"`).
- `errors.traceIdCopied` — confirmation toast (ru: `"ID скопирован"`, en: `"Trace ID copied"`).

## Data Flow

Per client-side request, happy path:

1. `apiClient` builds URL + headers.
2. `generateTraceparent()` → set `traceparent` header.
3. `fetch` to `/api/v1/...`. Next.js proxy forwards verbatim. Backend continues the trace.
4. Response headers include `X-Trace-Id`.
5. `serverTraceId = response.headers.get("X-Trace-Id") ?? generatedTraceId`.
6. Success: return JSON. Trace ID discarded.
7. Error: `new ApiRequestError(status, detail, serverTraceId)` + `trackApiError(...)` + throw.
8. Call site catches, calls `toastApiError(err, fallback)`. User sees toast with short ID + copy action.

### Edge cases

- **Network failure before headers arrive.** `fetch` rejects → `ApiRequestError(0, "network", null)`. Toast shows no ID line. `trackApiError` not called.
- **`X-Trace-Id` header missing on an error response** (shouldn't happen; defensive). Falls back to the locally generated ID.
- **Server returns a different `X-Trace-Id` than we sent.** Trust the server's ID. In practice they should match; if they don't, the server's ID is the one indexed in Grafana.
- **401 auto-logout.** Existing behavior clears auth and redirects. Trace ID is attached to the `ApiRequestError` before the redirect, even though the toast window is brief. No behavioral change beyond threading `traceId`.
- **204 / empty body.** Returned before the error path; unaffected.
- **SSR.** Same `apiClient` runs, `traceparent` is injected. `trackApiError` is a no-op on the server. Errors bubble to React error boundaries; no toast on the server.

## Call-site Migration

Approximately twenty sites currently call `toast.error(t("common.error"))` or similar from a `try/catch` or React Query `onError`. Migration is mechanical:

```ts
// Before
catch (err) {
  toast.error(t("common.error"));
}

// After
catch (err) {
  toastApiError(err, t("common.error"));
}
```

Sites with bespoke status handling (e.g. `if (err.status === 409) ... else toast.error(...)`) keep their specific branches and only replace the generic `else` arm with `toastApiError(err, fallback)`.

Sites to update (from initial grep):

- `src/app/[locale]/(public)/organizations/new/page.tsx`
- `src/app/[locale]/(dashboard)/org/listings/[id]/page.tsx`
- `src/app/[locale]/(public)/orders/[id]/page.tsx`
- `src/app/[locale]/(dashboard)/org/orders/[id]/page.tsx`
- `src/components/chat/chat-input.tsx`
- `src/components/catalog/order-form.tsx`
- `src/app/[locale]/(dashboard)/org/settings/page.tsx`
- `src/lib/hooks/use-chat.ts`
- `src/components/org/member-table.tsx`
- `src/components/org/join-org-dialog.tsx`
- `src/app/[locale]/(dashboard)/org/members/invite/page.tsx`
- `src/app/[locale]/(dashboard)/org/listings/page.tsx`
- `src/app/[locale]/(dashboard)/org/listings/new/page.tsx`
- `src/app/[locale]/(dashboard)/org/listings/[id]/edit/page.tsx`
- `src/lib/hooks/use-org-guard.ts`
- `src/components/org/photo-grid.tsx`
- `src/components/settings/profile-form.tsx`
- `src/components/settings/password-form.tsx`
- `src/components/settings/avatar-section.tsx`
- `src/app/[locale]/(auth)/login/page.tsx`
- `src/app/[locale]/(auth)/register/page.tsx`

List is authoritative at time of writing; the implementation pass re-greps and updates the list.

## Testing

Three narrow test surfaces using the existing Vitest + jsdom setup.

### `src/lib/observability/__tests__/trace.test.ts`

- `generateTraceparent().traceId` matches `/^[0-9a-f]{32}$/`.
- `generateTraceparent().spanId` matches `/^[0-9a-f]{16}$/`.
- `generateTraceparent().traceparent` matches `/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/`.
- Two calls produce different `traceId` values.
- No mocks; uses real `crypto.getRandomValues` from jsdom.

### `src/lib/api/__tests__/client.test.ts`

- Happy path: mock `fetch` to return 200 JSON. Assert outgoing request's `traceparent` header matches the W3C regex. Assert the returned value is the parsed JSON and no trace-ID side effect leaks to caller.
- Error path with matching IDs: mock `fetch` returning 500 with `X-Trace-Id: deadbeef…deadbeef` (32 hex). Assert thrown `ApiRequestError.traceId === "deadbeef…deadbeef"`. Mock `trackApiError`; assert called once with that ID, `status: 500`, the path, and the method.
- Server returns a *different* `X-Trace-Id` than sent: error carries the server's ID.
- Error response missing `X-Trace-Id`: error carries the locally generated ID.
- Network failure (fetch rejects): thrown `ApiRequestError(0, "network", null)`. `trackApiError` not called.

### `src/lib/api/__tests__/toast-error.test.ts`

- `ApiRequestError` with `traceId`: `sonner`'s `toast.error` called with `description` containing the short trace ID and an `action` object.
- `ApiRequestError` without `traceId`: `toast.error` called without a `description`.
- Non-`ApiRequestError`: `toast.error` called with `fallback` string only.
- `sonner` is mocked; tests assert call shape, not visual output.

### `src/lib/observability/__tests__/openreplay-events.test.ts`

- When `tracker` has not been started (default in jsdom), `trackApiError` does not throw and does not call `tracker.event`.

### Manual verification

- **Dev:** open network tab, confirm `traceparent` header on `/api/v1/*` requests. Trigger a 4xx and confirm toast shows `ID: <8 hex>…` with a working Copy action.
- **Prod (post-deploy):** trigger a known error, confirm the OpenReplay session contains an `api_error` event with the trace ID, and that ID pastes cleanly into Grafana and resolves a full backend trace.

## Out of Scope / Future

Listed to prevent scope creep, not committed:

- Browser span export (OTLP → collector). Would add `@opentelemetry/sdk-trace-web`, `instrumentation-fetch`, `context-zone`, an exporter, and a sampling strategy. Design above is compatible: the existing `traceparent` injection can be replaced by the SDK's `W3CTraceContextPropagator` without touching call sites.
- Sampling coordination with backend (head-based sampling ratios).
- Propagating `traceparent` from the browser through SSR to the backend to unify the full page-render chain under a single trace.
- Adding trace IDs to non-toast error surfaces (500 error boundary page, chunked-load failures).
- Trace IDs in the auth-flow inline error banners (`src/app/[locale]/(auth)/login/page.tsx`, `register/page.tsx`). These use `setGlobalError(t("common.error"))` to render a persistent banner, not a toast, so the `useApiErrorToast` hook does not fit. Auth errors have well-known causes (401 wrong credentials, 409 email exists) and the marginal value of a trace ID is low, so the deviation was accepted in the Task 7 migration.
