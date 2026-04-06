# Docker Build & Publish to ghcr.io

**Date:** 2026-04-06
**Status:** Approved

## Overview

Add a Dockerfile and GitHub Actions workflow to build the Next.js frontend as a Docker image and publish it to `ghcr.io/khamitovdr/equip-me-frontend`. The frontend will be deployed as a service in the existing backend docker-compose stack.

## Dockerfile — Multi-stage build

Three stages targeting `node:22-alpine`:

### Stage 1: `deps`

- Base: `node:22-alpine`
- Copy `package.json` and `package-lock.json`
- Run `npm ci` to install all dependencies (dev deps needed for the build step)

### Stage 2: `builder`

- Copy source code from project root
- Copy `node_modules` from `deps` stage
- Accept build args:
  - `API_URL` (default: `http://app:8000/api/v1`) — server-side API URL for SSR, resolves to the backend service in docker-compose network
  - `APP_VERSION` (default: `dev`)
- Set env vars for build:
  - `API_URL` — from build arg
  - `NEXT_PUBLIC_API_URL=/api/v1` — client-side API URL (proxied through Next.js API routes)
- Run `next build`

### Stage 3: `runner`

- Base: `node:22-alpine`
- Create non-root user `nextjs` (uid 1001)
- Copy from builder:
  - `.next/standalone` — self-contained Node.js server
  - `.next/static` → `.next/static` — static assets
  - `public` → `public` — public assets
- Set env vars:
  - `NODE_ENV=production`
  - `PORT=3000`
  - `HOSTNAME=0.0.0.0`
  - `APP_VERSION` from build arg
- Expose port 3000
- Run as `nextjs` user
- Entrypoint: `node server.js`

### next.config.ts change

Add `output: "standalone"` to the Next.js config. This makes Next.js produce a self-contained `server.js` with all dependencies bundled, suitable for Docker deployment.

## .dockerignore

```
node_modules
.next
.git
.gitignore
.env*
!.env.example
*.md
.DS_Store
.superpowers
docs
coverage
.vercel
```

## Composite Action: `.github/actions/publish-release/action.yml`

Reusable composite action following the backend's pattern.

### Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `version` | yes | — | Version string (e.g. `0.2.0`) |
| `image_name` | yes | — | Full ghcr.io image name |
| `github_token` | yes | — | GitHub token for registry auth and release creation |
| `api_url` | no | `http://app:8000/api/v1` | Backend API URL for SSR |

### Steps

1. Set up Docker Buildx (`docker/setup-buildx-action@v3`)
2. Log in to ghcr.io (`docker/login-action@v3`) using `github.actor` + `github_token`
3. Build and push Docker image (`docker/build-push-action@v6`):
   - Context: `.`
   - Push: `true`
   - Tags: `<image_name>:<version>`
   - Build args: `APP_VERSION=<version>`, `API_URL=<api_url>`
4. Create GitHub Release (`gh release create`):
   - Title: `v<version>`
   - Auto-generated notes from previous tag
   - Always marked as latest

## Workflow: `.github/workflows/release.yml`

### Trigger

`workflow_dispatch` — manual dispatch, restricted to `main` branch.

### Permissions

```yaml
permissions:
  contents: write
  packages: write
```

### Job: `release`

Condition: `if: github.ref_name == 'main'`

#### Steps

1. **Checkout** — `actions/checkout@v5` with `fetch-depth: 0`

2. **Compute next minor version** — parse current version from `package.json` using `node -p`, increment minor, reset patch to 0. Output: `version` (e.g. `0.2.0`), `current` (e.g. `0.1.0`).

3. **Configure git** — set user to `github-actions[bot]`

4. **Bump version and tag** — update version in `package.json` using `npm version <new> --no-git-tag-version`, commit, create tag `v<version>`

5. **Push commit and tag** — push to `main`

6. **Build, push, and create release** — call composite action:
   - `version`: computed version
   - `image_name`: `ghcr.io/khamitovdr/equip-me-frontend`
   - `github_token`: `${{ secrets.GITHUB_TOKEN }}`

## Secrets Required

| Secret | Purpose | Notes |
|--------|---------|-------|
| `GITHUB_TOKEN` | ghcr.io auth, GitHub Release creation | Auto-provided by GitHub Actions |

## File Summary

| File | Action |
|------|--------|
| `Dockerfile` | Create |
| `.dockerignore` | Create |
| `next.config.ts` | Modify — add `output: "standalone"` |
| `.github/actions/publish-release/action.yml` | Create |
| `.github/workflows/release.yml` | Create |
