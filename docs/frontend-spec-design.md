# Frontend Specification — Rental Platform

## 1. Overview

Single Next.js application serving all user roles: renters browsing and ordering equipment, organization staff managing listings and orders, and platform admins overseeing users and organizations. Bilingual (Russian + English) from day one, fully responsive across mobile, tablet, and desktop.

---

## 2. Architecture & Tech Stack

**Framework:** Next.js 15 (App Router)

**Key libraries:**

| Concern | Library |
|---------|---------|
| Styling | Tailwind CSS + shadcn/ui |
| Global client state | Zustand |
| Server state | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| i18n | next-intl |
| WebSocket | Native WebSocket with custom hook |
| Media carousel | Embla Carousel |
| Markdown rendering | react-markdown + rehype-sanitize |
| Theme | next-themes (light/dark/system) |
| Icons | Lucide React |

**Rendering strategy:**

| Page type | Rendering | Why |
|-----------|-----------|-----|
| Home, Catalog, Listing detail, Org profile | SSR | SEO, fast first paint |
| Auth pages (login/register) | Static | No dynamic data |
| User settings, Org dashboard, Order detail + chat | Client | Interactive, auth-gated, WebSocket |

**Project structure:**

```
src/
  app/
    [locale]/                    # i18n route group
      (public)/                  # Top navbar layout
        page.tsx                 # Home
        listings/
          page.tsx               # Catalog
          [id]/page.tsx          # Listing detail
        organizations/
          [id]/page.tsx          # Org public profile
          new/page.tsx           # Create organization
        orders/
          page.tsx               # My orders
          [id]/page.tsx          # Order detail + chat
        settings/page.tsx        # User settings
      (auth)/                    # Minimal centered layout
        login/page.tsx
        register/page.tsx
      (dashboard)/               # Org sidebar layout
        org/
          listings/
            page.tsx             # Org listings
            new/page.tsx         # Create listing
            [id]/edit/page.tsx   # Edit listing
          orders/
            page.tsx             # Org orders
            [id]/page.tsx        # Org order detail + chat
          members/
            page.tsx             # Member management (tabbed)
            invite/page.tsx      # Invite member
          settings/page.tsx      # Org settings
      (admin)/                   # Admin sidebar layout
        admin/
          users/page.tsx         # User management
          organizations/page.tsx # Org management
  components/
    ui/                          # shadcn/ui primitives
    catalog/                     # Listing cards, filters, search
    order/                       # Order detail, status badge, actions
    chat/                        # Chat panel, message bubbles, typing
    org/                         # Org dashboard components
    media/                       # Upload, carousel, avatar
    layout/                      # Navbar, sidebar, org switcher
  lib/
    api/                         # API client, typed endpoints
    hooks/                       # Custom hooks (useAuth, useChat, useOrg)
    i18n/                        # Locale config, messages
    stores/                      # Zustand stores
    validators/                  # Zod schemas (mirrors backend validation)
  types/                         # Shared TypeScript types
```

---

## 3. Route Map & Page Inventory

### Public Layout (top navbar)

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/` | Home | No | Hero banner, top listings carousel (latest published), top organizations (verified, by listing count), partners section (static logos), CTA banners |
| `/listings` | Catalog | No | Listing grid with full filters (search, category, price range, service flags, sort). Cursor-paginated |
| `/listings/[id]` | Listing Detail | No* | Carousel, specs, price, service flags, org card, reservation calendar (booked dates), inline order form (*auth to submit) |
| `/organizations/[id]` | Org Public Profile | No | Org info, contacts, listing grid for this org |
| `/organizations/new` | Create Organization | Yes | Dadata suggest input (type name or INN, pick from dropdown), org photo upload, contacts form (at least one) |
| `/orders` | My Orders | Yes | Order list with status filter, unread message badges. Cursor-paginated |
| `/orders/[id]` | Order Detail | Yes | Order info, status timeline, actions (confirm/decline/cancel), inline chat |
| `/settings` | User Settings | Yes | Edit name, email, phone, password, profile photo |

### Auth Layout (minimal, centered)

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/login` | Login | No | Email + password, link to register |
| `/register` | Register | No | Name, email, phone, password, profile photo (optional). Redirect to home after success |

### Org Dashboard Layout (sidebar)

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/org/listings` | Org Listings | Member | Listing table (all statuses), search, category filter. Create button for editors+ |
| `/org/listings/new` | Create Listing | Editor+ | Form: name, category, price, description, specs, service flags, media upload |
| `/org/listings/[id]/edit` | Edit Listing | Editor+ | Same form, pre-filled. Status change control |
| `/org/orders` | Org Orders | Member | Incoming orders list, status filter, unread message badges. Cursor-paginated |
| `/org/orders/[id]` | Org Order Detail | Member | Order info, requester info, actions (offer/reject/cancel), inline chat |
| `/org/members` | Members | Member | Three tabs: Members, Pending Requests, Invitations. Role badges |
| `/org/members/invite` | Invite Member | Admin | Invite form (email + role selection) |
| `/org/settings` | Org Settings | Admin | Org photo, contacts management, payment details |

### Admin Layout (sidebar)

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/admin/users` | User Management | Platform Admin | User list with search, role badges. Inline actions: change role, suspend |
| `/admin/organizations` | Org Management | Platform Admin | Org list, verification status. Verify action |

**Total: 20 pages** across 4 layout groups.

---

## 4. User Flows

### 4.1 Authentication

**Registration:**
1. User opens `/register`
2. Fills name, surname, middle name (optional), email, phone, password
3. Uploads profile photo (optional) — inline upload widget using shared media upload flow
4. Client-side Zod validation (same rules as backend: email format, Russian phone, password strength)
5. Submit -> API call -> receive JWT -> store in memory (Zustand) + httpOnly cookie
6. Redirect to `/` (home)

**Login:**
1. User opens `/login`
2. Email + password
3. Submit -> JWT -> redirect to previous page or `/`
4. On 401 -> generic error "Incorrect email or password"

**Session management:**
- JWT stored in httpOnly cookie for SSR pages, Zustand for client state
- 401 on any API call -> clear state, redirect to `/login`
- No refresh token — session expires after 7 days, user re-logs

### 4.2 Browsing & Ordering

**Catalog discovery:**
1. User lands on `/` -> sees hero, featured listings, top orgs
2. Clicks "Browse equipment" or a category -> `/listings`
3. Applies filters (category, price range, service flags), types search, changes sort
4. Filters reflected in URL query params (shareable, back-button friendly)
5. Scrolls -> cursor pagination loads more

**Placing an order:**
1. User opens `/listings/[id]`
2. Sees carousel, description, specs, price per day, reservation calendar (booked dates grayed out)
3. Picks start date + end date in date pickers (unavailable dates disabled based on reservations) -> estimated cost updates live
4. Clicks "Request rental" -> auth gate (redirect to `/login` if not authenticated, return after)
5. API call creates order (status: PENDING) -> redirect to `/orders/[id]`
6. User sees order detail with status "Pending" and chat available

### 4.3 Order Lifecycle (Renter Side)

1. **PENDING** — waiting for org. User can chat and can cancel
2. **OFFERED** — org sent offer (possibly adjusted cost/dates). User sees offer details highlighted, can:
   - **Accept** -> status becomes ACCEPTED (awaiting org approval)
   - **Cancel** -> status becomes CANCELED_BY_USER (terminal)
3. **ACCEPTED** — user accepted terms, waiting for org to approve and confirm reservation. User can cancel
4. **CONFIRMED** — org approved, reservation created. Auto-transitions to ACTIVE on start date. User can cancel
5. **ACTIVE** — rental in progress. Auto-transitions to FINISHED on end date. User can cancel
6. **FINISHED** — terminal. Chat becomes read-only after cooldown
7. **EXPIRED** — terminal. Start date passed without reaching CONFIRMED (background job). Chat becomes read-only

Cancel available in all non-terminal statuses (PENDING, OFFERED, ACCEPTED, CONFIRMED, ACTIVE).
Status shown as a visual timeline/stepper on the order detail page.

### 4.4 Order Lifecycle (Org Side)

1. **PENDING** — new order appears in `/org/orders`. Org can:
   - **Make offer** — fill offered cost + dates -> OFFERED
   - **Cancel** -> CANCELED_BY_ORGANIZATION (terminal)
2. **OFFERED** — waiting for user response. Org can revise offer (re-offer) or cancel
3. **ACCEPTED** — user accepted. Org can:
   - **Approve** -> CONFIRMED (creates reservation, checks date overlap)
   - **Re-offer** -> OFFERED (revise terms)
   - **Cancel** -> CANCELED_BY_ORGANIZATION (terminal)
4. **CONFIRMED** -> **ACTIVE** -> **FINISHED** — org can cancel during CONFIRMED or ACTIVE
5. Chat availability is controlled by the backend (active vs read_only status returned by API/WebSocket). Frontend only renders the UI state — no client-side logic for determining chat availability

Approval may fail if the listing has overlapping reservations for the offered dates — shown as a validation error.

### 4.5 Organization Creation & Management

**Creating an org:**
1. User navigates to `/organizations/new` (from user menu: "Create organization")
2. Types org name or INN into search field -> Dadata suggest/party API returns matches in dropdown
3. Selects an org -> legal data auto-fills (full name, INN, address, manager, etc.)
4. Uploads org profile photo (optional) — inline upload widget
5. Adds at least one contact (display name + phone and/or email). Can add more
6. Submit -> API creates org -> user becomes org admin -> redirect to `/org/settings`
7. Org starts as CREATED (unverified), not visible in public catalog until platform admin verifies

**Joining an org:**
- From user menu: "Join organization" -> opens a modal dialog with org search (by name) -> select org -> self-join as candidate -> wait for admin approval
- Or: accept an invitation link/notification

**Org context switching:**
- Org switcher in header shows current org name + dropdown of all orgs user belongs to
- Switching org reloads all `/org/*` views for the selected org
- Only visible when user has at least one membership

### 4.6 Chat

1. User or org member opens order detail page
2. **Desktop:** order info on the left, chat panel on the right (side-by-side). **Mobile:** chat is the main screen, order details accessible via collapsible menu at the top
3. Message history loads (cursor-paginated, scroll up for older)
4. WebSocket connects on mount (`ws://.../orders/[id]/chat/ws?token=...`)
5. Type message -> send -> appears in both parties' views in real-time
6. Typing indicator shows when other party is typing
7. Media attachments: click attach -> upload flow (presigned URL -> upload -> confirm) -> send message with media
8. Read receipts: messages marked as read when scrolled into view
9. Chat read-only state is determined by the backend (`chat_status` from WebSocket `connected` frame and REST endpoint). When read-only — input disabled, banner shown. No client-side logic for determining this

### 4.7 Media Upload (Shared Flow)

Used in: listing creation/edit, org photo, user profile photo, chat attachments.

1. User selects file(s)
2. Client validates type + size against limits
3. `POST /media/upload-url` -> get presigned URL + media_id
4. `PUT` file to presigned URL (with progress bar)
5. `POST /media/{id}/confirm` -> processing starts
6. Poll `GET /media/{id}/status` until READY or FAILED
7. On READY — show thumbnail/preview. On FAILED — show retry button

### 4.8 Platform Admin

**User management:**
1. Admin opens `/admin/users` -> searchable user list
2. Can change role (user <-> suspended) or promote/demote admin (admin only for owners)

**Org verification:**
1. Admin opens `/admin/organizations` -> org list with status
2. Clicks "Verify" on unverified org -> org becomes visible in public catalog

---

## 5. Component Architecture

### Layout Components

| Component | Description |
|-----------|-------------|
| `PublicNavbar` | Logo, nav links (Home, Catalog), locale switcher, auth buttons or user menu. Responsive: hamburger on mobile |
| `UserMenu` | Avatar dropdown: My Orders, Settings, Create/Join Organization, org list (links to switch), Logout. Shows org switcher if user has memberships |
| `OrgSwitcher` | Dropdown in org dashboard header — current org name + list of user's orgs. Triggers context switch |
| `OrgSidebar` | Dashboard sidebar: Listings, Orders, Members, Settings. Collapsible on mobile. Shows current org name + role badge |
| `AdminSidebar` | Admin sidebar: Users, Organizations |
| `LocaleSwitcher` | RU/EN toggle, persists in URL path prefix |
| `ThemeSwitcher` | Light/Dark/System toggle. Persists choice in localStorage, defaults to system. Uses next-themes |
| `NotificationBell` | Header bell icon with unread count badge. Placeholder — opens empty dropdown with "Coming soon" until backend support |

### Catalog Components

| Component | Description |
|-----------|-------------|
| `ListingCard` | Photo/video preview (media slides on hover based on mouse X position), category tag, name, price/day, org short name. Links to detail page |
| `ListingGrid` | Responsive grid of `ListingCard`. Handles empty state |
| `CatalogFilters` | Category select as checkbox badges (toggleable pills), price range (min/max inputs), service flag checkboxes, sort dropdown. Syncs with URL query params |
| `SearchBar` | Text input with debounced search. Used in navbar (compact) and catalog page (full) |
| `MediaCarousel` | Embla-based carousel for photos + videos. Thumbnails strip below, fullscreen on click. Video plays inline |
| `ListingSpecs` | Key-value table rendering the specifications JSON |
| `ListingDescription` | Renders listing description as sanitized Markdown (headings, bold, italic, lists, links). Uses react-markdown + rehype-sanitize to prevent XSS |

### Order Components

| Component | Description |
|-----------|-------------|
| `OrderForm` | Date range picker (start + end) with reservation calendar overlay (shows booked dates as unavailable), live estimated cost calculation, "Request rental" button. Auth gate |
| `ReservationCalendar` | Visual calendar showing existing reservations for a listing (booked date ranges highlighted as unavailable). Fetched from `GET /listings/{id}/reservations`. Used in OrderForm and listing detail |
| `OrderCard` | Status badge, listing name, dates, cost, unread message count badge. Links to order detail |
| `OrderList` | Filterable list of `OrderCard` with status tabs/chips. Cursor-paginated |
| `OrderStatusTimeline` | Visual stepper showing order progression: Pending -> Offered -> Accepted -> Confirmed -> Active -> Finished. Highlights current. Terminal states (Canceled, Expired) shown as red end-node |
| `OrderActions` | Context-aware action buttons. Renter: Accept, Cancel. Org: Offer, Approve, Re-offer, Cancel. Disabled states for invalid transitions |
| `OfferDetails` | Displays org's offer: offered cost, offered dates vs. original requested. Highlighted diff if changed |

### Chat Components

| Component | Description |
|-----------|-------------|
| `ChatPanel` | Container: message list + input. Mounts WebSocket on render, disconnects on unmount |
| `MessageList` | Scrollable message history, cursor-paginated (scroll up to load older). Groups by date |
| `MessageBubble` | Text + optional media attachments. Sender name, timestamp, read receipt tick. Left/right alignment by side |
| `ChatInput` | Text input, send button, attach button. Disabled when chat is read-only (with banner explaining why) |
| `TypingIndicator` | Animated dots shown when other party is typing |
| `MediaAttachment` | Thumbnail preview for photos/videos, file icon + name for documents. Click to view/download |

### Organization Components

| Component | Description |
|-----------|-------------|
| `OrgCard` | Org logo, name, listing count. Used on home page and catalog |
| `OrgInfoCard` | Detailed: logo, name, legal info, contacts. Used on listing detail (compact) and org public profile (full) |
| `MemberTable` | Table with name, email, role badge. Status shown only for non-members (candidate/invited). Actions column visible only to org admins |
| `MemberTabs` | Tab container: Members / Pending Requests / Invitations |
| `InviteForm` | Email input + role select (admin/editor/viewer) |
| `ContactsEditor` | Dynamic list of contacts (display name + phone/email). Add/remove. Minimum one enforced |
| `PaymentDetailsForm` | Bank account, BIC, bank INN, bank name, correspondent account fields |
| `DadataSuggest` | Autocomplete input — queries Dadata suggest/party API on keystroke, shows dropdown of matching orgs. On select, emits full org data |

### Media Components

| Component | Description |
|-----------|-------------|
| `FileUpload` | Drop zone + file picker. Validates type/size. Triggers presigned URL flow |
| `UploadProgress` | Progress bar during S3 upload. Shows processing spinner after confirm. Retry on failure |
| `PhotoGrid` | Draggable grid for reordering listing photos during edit. Add/remove |
| `AvatarUpload` | Circular crop preview for user/org profile photos. Single file |

### Shared / Primitives

| Component | Description |
|-----------|-------------|
| `CursorPagination` | "Load more" button or infinite scroll trigger. Manages cursor state |
| `EmptyState` | Illustration + message + optional CTA. Per-context variants |
| `StatusBadge` | Colored pill for order status, org status, member role/status |
| `ConfirmDialog` | Modal for destructive actions (cancel order, remove member) |
| `FormField` | Wrapper: label, input, error message. Works with React Hook Form |
| `DateRangePicker` | Two date inputs with calendar dropdown. Validates start < end |

---

## 6. State Management & Data Flow

### Global Client State (Zustand)

**Auth Store:**
- `user` — current user object (id, name, email, role) or null
- `token` — JWT string (also in httpOnly cookie for SSR)
- `isAuthenticated` — derived boolean
- `login(email, password)` / `logout()` / `updateProfile()`

**Org Context Store:**
- `currentOrg` — active organization object or null
- `membership` — current user's role + status in active org
- `organizations` — list of user's org memberships
- `switchOrg(orgId)` — sets active org, triggers refetch of org-scoped data

### Server State (TanStack Query)

All API data fetched and cached via TanStack Query.

| Query Key | Scope | Caching |
|-----------|-------|---------|
| `["listings", filters]` | Public catalog | Stale after 30s, background refetch |
| `["listing", id]` | Listing detail | Stale after 60s |
| `["orders", userId, filters]` | Renter's orders | Stale after 10s |
| `["org-orders", orgId, filters]` | Org's orders | Stale after 10s |
| `["org-listings", orgId, filters]` | Org's listings | Stale after 30s |
| `["members", orgId, tab]` | Org members | Stale after 30s |
| `["reservations", listingId]` | Listing reservations | Stale after 60s |
| `["chat-messages", orderId, cursor]` | Chat history | No auto-refetch (WebSocket handles updates) |
| `["chat-status", orderId]` | Chat active/read-only | Fetched on mount |
| `["media-status", mediaId]` | Upload processing poll | Refetch every 2s while PROCESSING |

Mutations invalidate relevant queries on success.

### WebSocket Data Flow (Chat)

```
Mount ChatPanel
  -> Connect WS: /orders/{id}/chat/ws?token={jwt}
  -> Receive "connected" frame -> set chat status

User types -> debounce 300ms -> send "typing" frame
User sends message -> send "message" frame -> optimistic insert into local message list
  -> Receive "message" frame -> replace optimistic with confirmed (dedupe by id)

Receive "message" from other party -> append to message list -> show unread indicator if scrolled up
Receive "typing" -> show/hide typing indicator (auto-hide after 3s timeout)
Receive "read" -> update read receipts on sent messages

Scroll message into view -> send "read" frame (batched, debounced)

Unmount ChatPanel -> disconnect WS
```

**Reconnection strategy:** On disconnect, attempt reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s). Show "Reconnecting..." banner in chat panel. On reconnect, fetch missed messages via REST endpoint, then resume WS.

### API Client

Typed API client wrapping `fetch`:
- **Two base URLs:** `NEXT_PUBLIC_API_URL` for client-side requests (public domain/proxy) and `API_URL` (server-only, no `NEXT_PUBLIC_` prefix) for SSR requests (internal network, e.g. `http://backend:8000`). SSR calls stay within the local network — no round-trip through the internet
- Auto-attaches `Authorization: Bearer {token}` header
- Response interceptor: 401 -> trigger logout + redirect to `/login`
- Request/response types mirroring backend Pydantic schemas
- Cursor pagination helper: accepts cursor, returns `{ items, next_cursor }`

### URL State

Catalog filters and order list filters stored in URL search params via `useSearchParams`:
- Shareable filtered views
- Back button preserves filter state
- SSR can read filters from URL for initial data fetch

---

## 7. Error Handling, Loading & Empty States

### Error Handling

**API errors:**

| HTTP Status | Handling |
|-------------|----------|
| 400 (validation) | Field-level errors on forms, or toast for general validation |
| 401 | Clear auth state, redirect to `/login` |
| 403 | Toast "You don't have permission" |
| 404 | Full-page "Not found" with link back |
| 409 (conflict) | Contextual: "Email already taken", "Already a member", etc. |
| 502 (external service) | Toast "Service temporarily unavailable, try again" |
| Network error | Toast "Connection lost" + retry button |

**Form validation — two layers:**
1. Client-side (Zod) — instant feedback, mirrors backend rules
2. Server-side — catches uniqueness and business logic errors, mapped back to form fields

**WebSocket errors:**
- Rate limited -> "Sending too fast, slow down" inline in chat
- Read-only chat -> disable input, show banner "Chat is closed"
- Connection failed -> reconnecting banner with status

### Loading States

| Context | Loading UX |
|---------|------------|
| Page navigation | Top progress bar (thin) |
| Listing grid | Skeleton cards (preserve grid layout) |
| Listing detail | Skeleton: carousel placeholder + text blocks |
| Order list | Skeleton cards |
| Chat messages | Spinner centered in chat panel on initial load |
| Chat sending | Optimistic message with "sending" opacity |
| Media upload | Progress bar on upload widget, spinner during processing |
| Dadata suggest | Spinner inside input dropdown |
| Mutations | Button shows spinner, disabled until complete |
| Cursor pagination | "Load more" button with spinner |

### Empty States

| Context | Message | CTA |
|---------|---------|-----|
| Catalog — no results | "No listings match your filters" | "Clear filters" |
| My Orders — none | "You haven't placed any orders yet" | "Browse catalog" |
| Org Orders — none | "No incoming orders yet" | — |
| Org Listings — none | "No listings yet" | "Create your first listing" (editor+) |
| Members — Pending tab | "No pending requests" | — |
| Members — Invitations tab | "No pending invitations" | "Invite a member" (admin) |
| Chat — no messages | "Start the conversation" | Focus input |
| Search — no results | "Nothing found for '{query}'" | "Try a different search" |

### Confirmation Dialogs

| Action | Dialog message |
|--------|---------------|
| Cancel order (renter) | "Are you sure you want to cancel this order?" |
| Cancel order (org) | "Are you sure you want to cancel this order? The renter will be notified." |
| Remove member | "Remove {name} from the organization?" |
| Delete listing | "Delete this listing? This cannot be undone." |
| Suspend user (admin) | "Suspend {name}? They will lose access to the platform." |

---

## 8. i18n, Responsive Design, Accessibility & SEO

### i18n (Russian + English)

**URL structure:** locale prefix — `/ru/listings`, `/en/listings`
- Default locale: Russian (`/ru`)
- Locale detection: browser `Accept-Language` on first visit -> redirect
- Switcher persists choice in cookie, updates URL prefix

**Translation files:** `src/lib/i18n/messages/{ru,en}.json`

Flat namespace with dot-separated keys:
```json
{
  "catalog.title": "Каталог оборудования",
  "catalog.noResults": "Ничего не найдено",
  "order.status.pending": "Ожидает ответа",
  "order.actions.confirm": "Подтвердить"
}
```

**Translated:** all UI text, date/number formatting (Russian: `dd.MM.yyyy`, `1 000 rub` — English: `MM/dd/yyyy`, `1,000 rub`), validation messages.

**Not translated:** user-generated content (listings, chat, org names), legal data from Dadata.

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, hamburger nav, stacked cards, full-width forms |
| Tablet | 640-1024px | Two-column listing grid, collapsible sidebar |
| Desktop | > 1024px | Three/four-column listing grid, persistent sidebar, side-by-side order+chat |

**Key responsive behaviors:**
- Public navbar -> hamburger menu on mobile with slide-out drawer
- Catalog grid -> 1 col (mobile), 2 col (tablet), 3-4 col (desktop)
- Listing detail -> carousel full-width; specs and order form stack on mobile, side-by-side on desktop
- Order detail + chat -> on mobile, chat is the main view with order details in a collapsible menu; on desktop, order info left + chat right side-by-side
- Org sidebar -> hidden on mobile with toggle, persistent on desktop
- Catalog filters -> collapsible drawer on mobile ("Filters" button), visible sidebar on desktop

### Accessibility

- shadcn/ui provides ARIA-compliant primitives (dialogs, dropdowns, tabs)
- Keyboard navigation: all interactive elements focusable, logical tab order
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Form fields: linked labels, error messages via `aria-describedby`
- Status changes: `aria-live="polite"` for order updates and new chat messages
- Media carousel: arrow key navigation, alt text on images
- Skip-to-content link on all layouts

### SEO

**SSR pages** (home, catalog, listing detail, org profile):
- Dynamic `<title>` and `<meta description>`
- Open Graph + Twitter Card meta tags
- Structured data (JSON-LD): `Product` on listings, `Organization` on org profiles
- Canonical URLs with locale prefix
- `sitemap.xml` from published listings + verified orgs
- `robots.txt` — allow public, disallow dashboard/admin

**Client-only pages** (orders, settings, dashboard): `noindex` meta tag.

### Testing Strategy

| Layer | Tool | What |
|-------|------|------|
| Unit | Vitest | Utility functions, Zod validators, store logic, format helpers |
| Component | Vitest + React Testing Library | Individual components: rendering, interactions, state |
| Integration | Vitest + React Testing Library | Page flows: form submission, filters, navigation |
| E2E | Playwright | Critical paths: register -> browse -> order -> chat; org: create listing -> receive order -> offer; admin: verify org |

**Test priority:**
1. Auth flow (login, register, session expiry)
2. Order lifecycle (create, confirm, decline, cancel)
3. Chat (send, receive, read receipts)
4. Catalog (search, filter, pagination)
5. Org management (create listing, member actions)

---

## 9. Future Considerations

- **Notifications system** — bell icon + inbox with real-time in-app notifications and email for critical events. UI designed with `NotificationBell` placeholder in header. Blocked on backend notification support.
