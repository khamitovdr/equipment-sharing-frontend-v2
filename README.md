# Equip Me — frontend

Web frontend for **Equip Me**, an equipment rental platform. Renters browse and book gear; owners run their inventory and orders through an organization-scoped dashboard; operators keep an eye on things from the admin area. Backend lives at `api.equip-me.ru`.

## Highlights

- **Typed from the UI down to the schema.** Backend OpenAPI spec → generated TypeScript types → Zod validators → `react-hook-form`. The same schema validates what the user types and what hits the wire.
- **Custom multi-role demo recorder.** `e2e-demo/` is a homemade Flow DSL on top of Playwright — barrier-synchronized browsers, an action registry, and a CLI that stitches side-by-side recordings of, say, a renter and an owner going through the same scenario at the same time. Fake cursor, click ripples, six flows from registration through member management.
- **Every API error carries its trace ID.** Requests ship a W3C `traceparent`; failures surface the backend's `X-Trace-Id` in the user-facing toast *and* in an OpenReplay `api_error` event. Support can jump straight from a user's screenshot to the matching backend trace.
- **Order chat between renter and owner,** scoped to a specific order, with cursor-paginated history.

## Stack

Next.js 16 on React 19, TypeScript strict. Tailwind v4 with shadcn components on top of `@base-ui/react` (not Radix). TanStack Query for server state, Zustand for client state. `next-intl` for ru/en. Vitest + Testing Library for units, Playwright for the `e2e-demo/` walkthrough recordings. See `package.json` for the full list.

Notable bits of the codebase:

- `src/app/api/v1/[...path]/` — the CORS-killing backend proxy
- `src/app/api/dadata/suggest/` — server-side DaData autocomplete bridge
- `src/components/openreplay.tsx` + `src/lib/observability/` — session replay wiring
- `src/lib/api/client.ts` — the fetch wrapper with tracing and 401 handling
- `src/proxy.ts` — next-intl middleware (Next 16 renamed `middleware.ts` → `proxy.ts`)
- `e2e-demo/` — Playwright flow DSL that records multi-role demos side-by-side

## Observability

`@openreplay/tracker` is mounted from `src/components/openreplay.tsx` and only starts in production builds when `NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY` is set. The tracker is dynamic-imported, so the bundle stays out of builds that won't ship it.

Sessions are tagged with the current user (id, email, phone, full name, role) and organization (id, short name, role) by subscribing to the Zustand auth and org stores — so a session can be filtered by either. The API client at `src/lib/api/client.ts` injects a W3C `traceparent` on every request and prefers the backend's `X-Trace-Id` on the response; failing requests fire a `tracker.event("api_error", …)` with that trace ID, which is also what surfaces in the user's error toast.

## Running locally

```bash
cp .env.example .env.local   # fill in what you need
npm ci
npm run dev                  # http://localhost:3000
```

Env vars (all in `.env.example`): `NEXT_PUBLIC_API_URL` and `API_URL` point at the proxy and the real backend; `DADATA_API_KEY` is optional (address autocomplete); `NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY` is optional and only activates in production builds.

Other commands you'll probably want: `npm run lint`, `npm test`, `npm run test:run`, `npm run demo:record`.

## Releasing

One workflow, `.github/workflows/release.yml`, triggered manually from `main`:

1. Bumps the minor version in `package.json`, commits, tags `vX.Y.Z`, pushes.
2. Builds the Docker image and pushes it to `ghcr.io/<owner>/equip-me-frontend:<version>`.
3. Creates a GitHub Release with notes auto-generated from commits since the previous tag.

To cut a release: **Actions → release → Run workflow**. Keep commit messages in `feat: / fix: / chore:` form — that's what makes the generated release notes readable. Repo needs `DADATA_API_KEY` and `OPENREPLAY_PROJECT_KEY` as secrets (plus the default `GITHUB_TOKEN`).
