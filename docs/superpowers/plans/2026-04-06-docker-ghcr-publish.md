# Docker Build & Publish to ghcr.io — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Next.js frontend as a Docker image and publish it to `ghcr.io/khamitovdr/equip-me-frontend` via a manual-dispatch GitHub Actions workflow.

**Architecture:** Multi-stage Dockerfile (deps → builder → runner) with standalone Next.js output. A reusable composite action handles Docker build+push and GitHub Release creation. A single `release.yml` workflow bumps the minor version, tags, and invokes the composite action.

**Tech Stack:** Next.js 16, Docker (multi-stage, node:22-alpine), GitHub Actions, ghcr.io

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `next.config.ts` | Modify | Add `output: "standalone"` |
| `.dockerignore` | Create | Exclude unnecessary files from Docker context |
| `Dockerfile` | Create | Multi-stage build: deps → builder → runner |
| `.github/actions/publish-release/action.yml` | Create | Reusable composite: Docker Buildx → ghcr.io push → GitHub Release |
| `.github/workflows/release.yml` | Create | Manual-dispatch workflow: version bump → tag → invoke composite action |

---

### Task 1: Enable standalone output in Next.js config

**Files:**
- Modify: `next.config.ts:6-8`

- [ ] **Step 1: Add `output: "standalone"` to the Next.js config**

Edit `next.config.ts` — change the `nextConfig` object:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  skipTrailingSlashRedirect: true,
};
```

- [ ] **Step 2: Verify the build still works**

Run: `npm run build`
Expected: Build succeeds. The `.next/standalone` directory is created containing `server.js`.

- [ ] **Step 3: Add `.next/standalone` output to `.gitignore`**

The `.next/` directory is already in `.gitignore`, so standalone output is already ignored. No change needed — just verify.

Run: `grep '\.next' .gitignore`
Expected: `/.next/` is listed.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat: enable standalone output for Docker deployment"
```

---

### Task 2: Create `.dockerignore`

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: Create `.dockerignore`**

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

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore"
```

---

### Task 3: Create the Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create the Dockerfile**

```dockerfile
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

ARG API_URL=http://app:8000/api/v1
ARG APP_VERSION=dev

ENV API_URL=${API_URL}
ENV NEXT_PUBLIC_API_URL=/api/v1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ARG APP_VERSION=dev
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV APP_VERSION=${APP_VERSION}

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

- [ ] **Step 2: Test the Docker build locally**

Run: `docker build -t equip-me-frontend:test .`
Expected: Build completes successfully through all three stages.

- [ ] **Step 3: Test the container starts**

Run: `docker run --rm -p 3000:3000 equip-me-frontend:test`
Expected: Container starts, logs show Next.js server listening on port 3000. Press Ctrl+C to stop.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile
git commit -m "feat: add multi-stage Dockerfile for Next.js standalone"
```

---

### Task 4: Create the composite action

**Files:**
- Create: `.github/actions/publish-release/action.yml`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p .github/actions/publish-release
```

- [ ] **Step 2: Create the composite action**

Create `.github/actions/publish-release/action.yml`:

```yaml
name: Publish Release
description: Build Docker image, push to ghcr.io, create GitHub Release

inputs:
  version:
    description: Version string (e.g., 0.2.0)
    required: true
  image_name:
    description: Full ghcr.io image name (e.g., ghcr.io/owner/equip-me-frontend)
    required: true
  github_token:
    description: GitHub token for registry auth and release creation
    required: true
  api_url:
    description: Backend API URL for SSR
    required: false
    default: "http://app:8000/api/v1"

runs:
  using: composite
  steps:
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to ghcr.io
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ inputs.github_token }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v6
      with:
        context: .
        push: true
        tags: ${{ inputs.image_name }}:${{ inputs.version }}
        build-args: |
          APP_VERSION=${{ inputs.version }}
          API_URL=${{ inputs.api_url }}

    - name: Create GitHub Release
      shell: bash
      env:
        GH_TOKEN: ${{ inputs.github_token }}
      run: |
        PREV_TAG=$(git tag --sort=-v:refname | grep -v "^v${{ inputs.version }}$" | head -1 || true)
        if [ -n "$PREV_TAG" ]; then
          gh release create "v${{ inputs.version }}" \
            --title "v${{ inputs.version }}" \
            --generate-notes \
            --notes-start-tag "$PREV_TAG" \
            --latest
        else
          gh release create "v${{ inputs.version }}" \
            --title "v${{ inputs.version }}" \
            --generate-notes \
            --latest
        fi
```

- [ ] **Step 3: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/actions/publish-release/action.yml'))"`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add .github/actions/publish-release/action.yml
git commit -m "feat: add publish-release composite action"
```

---

### Task 5: Create the release workflow

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create the release workflow**

Create `.github/workflows/release.yml`:

```yaml
name: release

on:
  workflow_dispatch:

permissions:
  contents: write
  packages: write

jobs:
  release:
    runs-on: ubuntu-latest
    if: github.ref_name == 'main'
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: Compute next minor version
        id: version
        run: |
          CURRENT=$(node -p "require('./package.json').version")
          IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
          NEW_VERSION="${MAJOR}.$((MINOR + 1)).0"
          echo "current=$CURRENT" >> "$GITHUB_OUTPUT"
          echo "version=$NEW_VERSION" >> "$GITHUB_OUTPUT"
          echo "Bumping $CURRENT → $NEW_VERSION"

      - name: Configure git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Bump version and tag
        run: |
          npm version "${{ steps.version.outputs.version }}" --no-git-tag-version
          git add package.json package-lock.json
          git commit -m "chore: bump version to ${{ steps.version.outputs.version }}"
          git tag "v${{ steps.version.outputs.version }}"

      - name: Push commit and tag
        run: |
          git push origin main
          git push origin "v${{ steps.version.outputs.version }}"

      - name: Build, push, and create release
        uses: ./.github/actions/publish-release
        with:
          version: ${{ steps.version.outputs.version }}
          image_name: ghcr.io/${{ github.repository_owner }}/equip-me-frontend
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 3: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "feat: add release workflow for Docker build and ghcr.io publish"
```

---

## Verification

After all tasks are done, verify the full setup:

- [ ] `npm run build` succeeds and produces `.next/standalone/server.js`
- [ ] `docker build -t equip-me-frontend:test .` succeeds
- [ ] `docker run --rm -p 3000:3000 equip-me-frontend:test` starts and serves pages
- [ ] All YAML files pass syntax validation
- [ ] All changes are committed
