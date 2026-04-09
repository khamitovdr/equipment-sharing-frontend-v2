# Demo Recordings — Screenplay Pattern DSL + Playwright

**Date:** 2026-04-09
**Goal:** Automated, polished demo screen recordings of all major platform user flows for marketing/demo purposes. Multi-role flows produce synchronized separate videos that can be played side by side.

---

## Architecture Overview

A declarative Flow DSL defines each demo script. A runner engine interprets the DSL, manages Playwright browser contexts (one per role), synchronizes roles at named barriers, and outputs `.webm` video recordings.

### Project Structure

```
e2e-demo/
├── playwright.config.ts          # Playwright config (video, viewport, baseURL)
├── run.ts                        # CLI entry point
├── runner/
│   ├── types.ts                  # Flow DSL type definitions
│   ├── engine.ts                 # Core runner — creates contexts, executes steps, syncs roles
│   ├── actions.ts                # Action handlers (navigate, click, fill, custom actions)
│   ├── sync.ts                   # Barrier-based sync coordinator for multi-role timing
│   └── recorder.ts               # Video output management (naming, paths)
├── flows/
│   ├── 01-registration.flow.ts
│   ├── 02-browse-and-order.flow.ts
│   ├── 03-create-organization.flow.ts
│   ├── 04-add-listing.flow.ts
│   ├── 05-order-lifecycle.flow.ts
│   └── 06-member-management.flow.ts
├── fixtures/
│   └── seed-data.ts              # Pre-seeded account credentials, org IDs, listing IDs
├── helpers/
│   └── auth.ts                   # Login helper (reusable across flows)
└── recordings/                   # Output directory (.gitignored)
```

Lives inside the frontend repo at `e2e-demo/`.

---

## DSL Type System

```ts
type Role = string;

interface FlowDefinition {
  name: string;
  description: string;
  viewport: { width: number; height: number }; // default 1280x720
  roles: Record<Role, RoleConfig>;
  steps: Step[];
}

interface RoleConfig {
  auth: { email: string; password: string } | null; // null = registers fresh
  startUrl?: string;
}

type Step =
  | ActionStep
  | SyncPoint
  | PauseStep;

interface ActionStep {
  role: Role;
  action: string;
  target?: string;
  data?: Record<string, unknown>;
  description?: string;
}

interface SyncPoint {
  sync: string;
}

interface PauseStep {
  role: Role;
  pause: number; // milliseconds
}
```

**Design decisions:**
- `roles` is a `Record` — each role carries its own config (auth, start URL).
- `SyncPoint` is role-agnostic — all roles pause until everyone reaches the named barrier.
- `PauseStep` is per-role — adds natural human-like pacing.
- Actions are string-based — mapped to handler functions, making custom actions easy to add.

---

## Built-in Actions

| Action     | Target                      | Data                              | Behavior                                      |
|------------|-----------------------------|-----------------------------------|-----------------------------------------------|
| `navigate` | URL path                    | —                                 | `page.goto(baseURL + target)`                 |
| `click`    | CSS selector                | —                                 | Click with human-like delay                   |
| `fill`     | CSS selector                | `{ value: string }`               | Focus, clear, type with keystroke delay        |
| `select`   | CSS selector                | `{ value: string }`               | Select dropdown option                        |
| `upload`   | CSS selector                | `{ files: string[] }`             | Upload file(s) via file chooser               |
| `scroll`   | CSS selector or `"bottom"`  | —                                 | Smooth scroll to element or page bottom        |
| `waitFor`  | CSS selector                | `{ state?: "visible" \| "attached" }` | Wait for element to appear               |
| `screenshot` | —                         | `{ name: string }`                | Named screenshot for debugging                |

Every built-in action adds a random delay (centered around the global pacing setting, default 300ms, with +/-150ms jitter) after execution to mimic human interaction.

### Custom Action Registration

Flows register composite domain-specific actions:

```ts
defineAction("fillOrder", async (page, { data }) => {
  await page.fill('[name="startDate"]', data.startDate);
  await page.fill('[name="endDate"]', data.endDate);
  await page.click('button[type="submit"]');
});

defineAction("makeOffer", async (page, { data }) => {
  await page.click('[data-testid="make-offer-btn"]');
  await page.fill('[name="price"]', String(data.price));
  await page.click('button[type="submit"]');
});
```

---

## Sync Engine

Barrier-based synchronization for multi-role flows:

```ts
class SyncCoordinator {
  private barriers: Map<string, {
    expected: number;
    arrived: Set<Role>;
    resolve: () => void;
  }>;

  async waitAtBarrier(barrierName: string, role: Role): Promise<void>;
}
```

The engine runs each role's steps concurrently in separate async tracks. When a `SyncPoint` is encountered, that role's track pauses until all roles reach the same barrier.

```
Timeline for 05-order-lifecycle:

user track:     login → browse → fill order → submit ──┤ sync:order-placed ├── wait → accept
                                                        │                    │
orgAdmin track: login → navigate to dashboard ──────────┤ sync:order-placed ├── see order → make offer
```

**Edge cases:**
- Roles with no steps between two sync points immediately arrive at the next barrier.
- Action failure: capture screenshot, log error, stop flow. Partial recordings are preserved.
- Barrier timeout: 30s default. Clear error if a role doesn't arrive.

---

## Flow Scripts

### Flow 1: Registration + Profile Setup
- **Roles:** `user` (no auth — registers fresh)
- **Pre-seeded:** nothing
- **Steps:** navigate to register → fill name/email/phone/password → upload avatar → submit → lands on home page

### Flow 2: Browse Catalog + Place Order
- **Roles:** `user` (pre-seeded account)
- **Pre-seeded:** user account, org with published listings
- **Steps:** login → home page → click catalog → apply category filter → scroll results → click listing → view details → fill order dates → see estimated cost → submit order

### Flow 3: Create Organization
- **Roles:** `user` (pre-seeded account)
- **Pre-seeded:** user account
- **Steps:** login → navigate to organizations → click create → enter INN → watch Dadata autofill → add contact → submit → redirected to org dashboard

### Flow 4: Add Equipment Listing
- **Roles:** `orgAdmin` (pre-seeded with org)
- **Pre-seeded:** user account + org
- **Steps:** login → org dashboard → listings → click create → fill name/category/price/description → add specs → toggle service flags → upload 3 photos → submit → see published listing

### Flow 5: Order Lifecycle (side-by-side)
- **Roles:** `user` (renter), `orgAdmin` (org owner)
- **Pre-seeded:** both accounts, org with listings
- **Steps:**
  1. Both login → `sync:ready`
  2. User browses catalog, places order → `sync:order-placed`
  3. OrgAdmin sees new order, makes counter-offer → `sync:offer-made`
  4. User sees offer, accepts → `sync:offer-accepted`
  5. OrgAdmin confirms the order → `sync:confirmed`
  6. Both see final confirmed state

### Flow 6: Member Management (side-by-side)
- **Roles:** `orgAdmin`, `invitee` (pre-seeded, not in org)
- **Pre-seeded:** both accounts, org
- **Steps:**
  1. Both login → `sync:ready`
  2. OrgAdmin invites invitee by email with editor role → `sync:invite-sent`
  3. Invitee sees invitation, accepts → `sync:invite-accepted`
  4. OrgAdmin sees new member in members list

---

## Seed Data

`fixtures/seed-data.ts` exports credentials and IDs for pre-seeded entities:

- **User accounts:** renter user, org admin user, invitee user (email + password for each)
- **Organization:** at least one org with the admin as owner
- **Listings:** at least 3-5 published listings in that org with photos and varied categories

This data must exist on whatever environment the scripts target.

---

## Running & Output

### npm Scripts

```
npm run demo:record              # Record all 6 flows
npm run demo:record -- --flow 05 # Record a specific flow
npm run demo:record -- --flow 05 --role user  # One role only
```

### Output Structure

```
recordings/
├── 01-registration/
│   └── user.webm
├── 02-browse-and-order/
│   └── user.webm
├── 03-create-organization/
│   └── user.webm
├── 04-add-listing/
│   └── orgAdmin.webm
├── 05-order-lifecycle/
│   ├── user.webm
│   └── orgAdmin.webm
└── 06-member-management/
    ├── orgAdmin.webm
    └── invitee.webm
```

`recordings/` is gitignored.

### Playwright Configuration

- `baseURL`: defaults to `http://localhost:3000`, overridable via `DEMO_BASE_URL` env var
- `viewport`: `{ width: 1280, height: 720 }`
- `video`: `{ mode: "on", size: { width: 1280, height: 720 } }`
- `actionTimeout`: 10s
- `navigationTimeout`: 15s
- Human pacing delay: 300ms default, configurable
