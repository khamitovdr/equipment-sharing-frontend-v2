# Slice A: Foundation + Auth + Catalog — UI Design Spec

## Overview

First implementation slice for Equip Me — an equipment rental platform. Establishes the full Next.js 15 project skeleton, authentication, and public-facing pages (home, catalog, listing detail, org profile). All subsequent slices (orders, org dashboard, admin) build on this foundation.

**Backend:** `https://api.equip-me.ru/` (production). OpenAPI spec at `https://api.equip-me.ru/openapi.json`.

**Pages in scope:** Home, Catalog, Listing Detail, Organization Public Profile, Login, Register (6 pages + 2 layouts).

---

## 1. Visual Identity

- **Direction:** Clean / Minimal — monochrome, typography-driven, lots of whitespace. Linear/Vercel aesthetic.
- **Accent color:** Pure black. No separate accent — black buttons, underlined links. Maximum minimalism.
- **Theme:** Light mode only. Dark mode deferred to a future slice.
- **Color palette:** shadcn/ui zinc base. Black primary (`#111`), zinc grays for borders/muted text (`#71717a`, `#e5e7eb`, `#f4f4f5`, `#fafafa`).
- **Typography:** System font stack via Next.js (`Inter` or `Geist`). Tight letter-spacing on headings.
- **Radius:** Small (6-8px) for cards and inputs. Nothing overly rounded.
- **Shadows:** Minimal — subtle border-based separation preferred over drop shadows.

---

## 2. Project Structure

```
src/
  app/
    [locale]/
      (public)/                  # PublicNavbar layout
        page.tsx                 # Home
        listings/
          page.tsx               # Catalog
          [id]/page.tsx          # Listing detail
        organizations/
          [id]/page.tsx          # Org public profile
      (auth)/                    # Minimal centered layout
        login/page.tsx
        register/page.tsx
      (dashboard)/               # OrgSidebar layout (placeholder)
        layout.tsx
      (admin)/                   # AdminSidebar layout (placeholder)
        layout.tsx
      layout.tsx                 # Root locale layout (providers)
      not-found.tsx              # 404 page
    layout.tsx                   # HTML root (fonts, metadata)
    globals.css                  # Tailwind + shadcn/ui theme tokens
  components/
    ui/                          # shadcn/ui primitives
    catalog/                     # ListingCard, ListingGrid, CatalogFilters, SearchBar, MediaCarousel
    layout/                      # PublicNavbar, UserMenu, LocaleSwitcher, Footer
    media/                       # AvatarUpload (for register)
  lib/
    api/                         # Typed API client + endpoint functions
    hooks/                       # useAuth, custom query hooks
    i18n/                        # next-intl config, ru.json + en.json
    stores/                      # Zustand auth store
    validators/                  # Zod schemas mirroring backend
  types/                         # Shared TS types generated from OpenAPI
```

---

## 3. Foundation Layer

### TypeScript Types

Generated from `backend_openapi.json`. Covers all request/response schemas: `UserRead`, `UserCreate`, `LoginRequest`, `TokenResponse`, `ListingRead`, `ListingCreate`, `ListingCategoryRead`, `OrganizationRead`, `OrganizationListRead`, `OrderCreate`, `ReservationRead`, `MediaStatusResponse`, `UploadUrlRequest`, `UploadUrlResponse`, `PaginatedResponse<T>`, etc.

### API Client

Thin wrapper around `fetch`:
- **Base URL:** `https://api.equip-me.ru/api/v1`
- **Two environments:** `NEXT_PUBLIC_API_URL` for client-side, `API_URL` (server-only) for SSR. Both point to production for now.
- Auto-attaches `Authorization: Bearer {token}` header when authenticated.
- **401 interceptor:** clears auth state, redirects to `/login`.
- Typed endpoint functions organized by domain:
  - `api.users.login(data)`, `api.users.register(data)`, `api.users.me()`
  - `api.listings.list(params)`, `api.listings.get(id)`, `api.listings.categories()`
  - `api.organizations.list(params)`, `api.organizations.get(id)`, `api.organizations.categories(orgId, params)`
  - `api.orders.create(data)`
  - `api.media.requestUploadUrl(data)`, `api.media.confirm(id)`, `api.media.status(id)`
  - `api.reservations.list(listingId)`
- Cursor pagination helper: accepts `cursor` + `limit`, returns `{ items, next_cursor, has_more }`.

### i18n (next-intl)

- `[locale]` route prefix. Supported locales: `ru`, `en`. Default: `ru`.
- Locale detection: browser `Accept-Language` on first visit → redirect.
- `LocaleSwitcher` persists choice in cookie, updates URL prefix.
- Translation files: `src/lib/i18n/messages/ru.json`, `src/lib/i18n/messages/en.json`.
- Flat dot-separated keys: `"catalog.title"`, `"order.actions.confirm"`, etc.
- Translated: all UI text, date/number formatting (Russian: `dd.MM.yyyy`, `1 000 rub` — English: `MM/dd/yyyy`, `1,000 rub`), validation messages.
- Not translated: user-generated content (listings, chat, org names).

### TanStack Query

| Query Key | Endpoint | Stale Time |
|-----------|----------|------------|
| `["listings", filters]` | `GET /listings` | 30s |
| `["listing", id]` | `GET /listings/{id}` | 60s |
| `["listing-categories"]` | `GET /listings/categories` | 60s |
| `["org-categories", orgId]` | `GET /organizations/{orgId}/listings/categories` | 60s |
| `["organizations", params]` | `GET /organizations` | 30s |
| `["organization", id]` | `GET /organizations/{id}` | 60s |
| `["reservations", listingId]` | `GET /listings/{id}/reservations` | 60s |
| `["media-status", mediaId]` | `GET /media/{id}/status` | Refetch every 2s while PROCESSING |

Mutations invalidate relevant queries on success.

### Zustand Auth Store

```
user: UserRead | null
token: string | null
isAuthenticated: boolean (derived)
login(email, password): Promise<void>
register(data): Promise<void>
logout(): void
fetchMe(): Promise<void>
updateProfile(data): Promise<void>
```

On app load: call `GET /users/me` to hydrate from cookie. If 401 → clear state silently.

---

## 4. Auth Pages

### Login (`/(auth)/login`)

- Minimal centered layout. Logo at top, form card below, max-width ~400px.
- Fields: email, password.
- Submit button: black, full-width.
- Link to register below.
- On success: JWT stored in Zustand + httpOnly cookie, redirect to previous page or `/`.
- On error: generic "Incorrect email or password" inline.

### Register (`/(auth)/register`)

- Same layout as login.
- Fields: name, surname, middle name (optional), email, phone, password.
- Profile photo upload (optional): `AvatarUpload` widget — circular crop preview, uses media upload flow (presigned URL → upload → confirm → poll status).
- Client-side Zod validation mirroring backend: email format, Russian phone format (`+7...`), password strength.
- On success: JWT received, redirect to `/`.
- On error: field-level errors mapped from backend. 409 conflicts shown inline ("Email already taken").

### Session Management

- JWT in httpOnly cookie for SSR, Zustand for client state.
- 401 on any API call → clear state, redirect to `/login`.
- No refresh token. 7-day expiry, user re-logs.

---

## 5. Home Page (`/(public)/page.tsx`)

SSR for SEO. Sections top to bottom:

### 5.1 Hero Banner

Full-width. Bold headline (e.g., "Rent equipment for any project"), subtitle, prominent search bar that navigates to `/listings?search=...`. CTA button "Browse catalog" alongside search. Clean background, strong typography.

### 5.2 Top Listings Carousel

Horizontal scrollable row of `ListingCard` components. Fetched via `GET /listings?limit=10` (latest published). Title: "Latest equipment". Arrow buttons for desktop scroll, swipe on mobile. Uses Embla Carousel.

### 5.3 Top Organizations

Grid of `OrgCard` components (org photo, name, published listing count). Fetched via `GET /organizations?limit=6` (only verified orgs returned). Title: "Trusted organizations". Links to `/organizations/[id]`.

### 5.4 Partners Section

Static row of partner logos. Hardcoded image assets (no backend endpoint). Grayscale logo bar with subtle hover effect.

### 5.5 CTA Banners

Two side-by-side cards:
- "Have equipment to rent?" → `/organizations/new`
- "Looking for something specific?" → `/listings`

### Data Fetching

SSR with TanStack Query prefetching. Listings and organizations fetched server-side, hydrated to client.

---

## 6. Catalog Page (`/(public)/listings/page.tsx`)

SSR. Filters synced to URL query params.

### Layout

- **Desktop:** filter sidebar on the left (~280px), listing grid on the right.
- **Mobile:** "Filters" button at top opens slide-up drawer, grid below.

### Filters (`CatalogFilters`)

| Filter | Control | URL Param |
|--------|---------|-----------|
| Search | Text input, 300ms debounce | `?search=` |
| Category | Toggleable pill badges, multi-select. From `GET /listings/categories/` | `?category=id1,id2` |
| Price range | Min/max number inputs | `?price_min=&price_max=` |
| Service flags | Checkboxes: delivery, with_operator, on_owner_site, installation, setup | `?delivery=true&...` |
| Sort | Dropdown: newest (default), price low→high, price high→low | `?sort=price_asc` |

"Clear filters" link visible when any filter active.

### Listing Grid (`ListingGrid`)

- Responsive: 1 col mobile, 2 col tablet, 3-4 col desktop.
- **`ListingCard`:** photo area with hover scrubbing, category tag, name, price/day.
  - **Hover photo scrubbing:** photos array displayed as layers. Mouse X position maps to photo index. Dot indicators below. On mobile: swipe gesture instead.
  - Links to `/listings/[id]`.

### Pagination

Cursor-based "Load more" button at bottom. Uses `next_cursor` from API. TanStack Query `useInfiniteQuery`.

### URL State

All filters synced via `useSearchParams`. SSR reads params for initial fetch. Shareable, back-button friendly.

### Empty State

"No listings match your filters" + "Clear filters" button.

---

## 7. Listing Detail Page (`/(public)/listings/[id]/page.tsx`)

SSR for SEO.

### Layout

- **Desktop:** two columns — left (~60%) media + description, right (~40%) order form + org info. Right column is sticky.
- **Mobile:** single column stacked: media, order form, description, org info.

### Left Column

- **MediaCarousel:** Embla-based. Photos + videos from listing. Thumbnail strip below, fullscreen on click. Video plays inline. Arrow key navigation.
- **Description:** rendered as sanitized Markdown via `react-markdown` + `rehype-sanitize`.
- **Specifications:** key-value table from the `specifications` field.

### Right Column

- **Price:** prominent display: "{price} rub/day".
- **Service flags:** icon + label chips for enabled flags (delivery, operator, on-site, installation, setup).
- **Reservation calendar + date range picker (unified component):**
  - Calendar view showing existing reservations (from `GET /listings/{listing_id}/reservations`) as grayed-out unavailable ranges.
  - User picks start and end date directly on the calendar.
  - Estimated cost updates live: (selected days) x (price/day).
  - "Request rental" button below.
  - Auth gate: if not authenticated → redirect to `/login` with return URL.
  - On submit: `POST /orders` → redirect to `/orders/[id]` (future slice; for now show success toast).
- **Org info card:** compact — org photo, org name, link to `/organizations/[id]`. Fetched via `GET /organizations/{org_id}`.

### Data Fetching

- `GET /listings/{listing_id}` — server-side.
- `GET /listings/{listing_id}/reservations` — client-side (interactive calendar).
- `GET /organizations/{org_id}` — secondary query for org info card.

---

## 8. Organization Public Profile (`/(public)/organizations/[id]/page.tsx`)

SSR.

### Layout

Single column, max-width container.

- **Header:** org photo (or placeholder), org name, legal address, verification badge if verified.
- **Contacts:** list of contacts (display name + phone/email).
- **Category filters:** toggleable pill badges from `GET /organizations/{org_id}/listings/categories/` (org-specific categories).
- **Listings grid:** same `ListingGrid` component. Fetched via `GET /listings?organization_id={org_id}`. Cursor-paginated "Load more".
- **Empty state:** "This organization has no listings yet".

### Data Fetching

- `GET /organizations/{org_id}` — server-side.
- `GET /organizations/{org_id}/listings/categories/` — for filter pills.
- `GET /listings?organization_id={org_id}` — listings filtered to this org.

---

## 9. Public Layout & Navigation

### PublicNavbar

Top-fixed, white background, subtle bottom border.

**Desktop (left to right):**
- Logo: "equip me" lowercase, bold, tight letter-spacing. Black square icon with "E".
- Nav links: Home, Catalog.
- Right side: `LocaleSwitcher` (RU/EN toggle), `NotificationBell` (placeholder), auth buttons OR `UserMenu`.

**When not authenticated:** "Log in" text button + "Sign up" black filled button.

**When authenticated — `UserMenu`:** avatar dropdown:
- My Orders → `/orders` (shows "coming soon" until future slice)
- Settings → `/settings` (shows "coming soon" until future slice)
- Divider
- Create Organization → `/organizations/new` (future slice)
- Join Organization (future slice)
- Org list if user has memberships (future slice)
- Divider
- Logout

**Mobile:** logo left, hamburger right. Slide-out drawer with nav links, locale switcher, auth/user menu items stacked.

### NotificationBell

Placeholder — bell icon in navbar, no badge. Dropdown with "Coming soon" text.

### LocaleSwitcher

RU/EN text toggle. Switches `[locale]` prefix in URL. Persists in cookie.

### Footer

Simple — logo, copyright, placeholder links. Keeps pages from feeling cut off.

---

## 10. Loading, Error & Empty States

### Loading

| Context | UX |
|---------|-----|
| Page navigation | Thin top progress bar (NProgress-style) |
| Listing grid | Skeleton cards preserving grid layout |
| Listing detail | Skeleton: carousel placeholder + text blocks |
| Home page sections | Skeleton per section (carousel row, org grid) |
| Auth form submit | Button shows spinner, disabled until complete |
| Media upload | Progress bar during S3 upload, spinner during processing |
| Cursor pagination | "Load more" button with spinner |

### Error Handling

| HTTP Status | Handling |
|-------------|----------|
| 400 (validation) | Field-level errors on forms, toast for general validation |
| 401 | Clear auth state, redirect to `/login` |
| 403 | Toast "You don't have permission" |
| 404 | Full-page "Not found" with link home |
| 409 (conflict) | Contextual inline: "Email already taken", etc. |
| Network error | Toast "Connection lost" with retry button |

**Toast system:** shadcn/ui `Sonner` — minimal, top-right, auto-dismiss.

### Empty States

| Context | Message | CTA |
|---------|---------|-----|
| Catalog — no results | "No listings match your filters" | "Clear filters" |
| Org profile — no listings | "This organization has no listings yet" | — |
| Search — no results | "Nothing found for '{query}'" | "Try a different search" |

---

## 11. Out of Scope (Future Slices)

- **Slice B:** Orders + Chat (order list, order detail, chat panel, WebSocket)
- **Slice C:** Org Dashboard (org creation, listings CRUD, org orders, members, settings)
- **Slice D:** Admin + Polish (user/org management, SEO structured data, dark mode, accessibility audit)

Pages linked from Slice A that belong to future slices (e.g., `/orders/[id]`, `/organizations/new`) will either show a "coming soon" state or redirect as appropriate.
