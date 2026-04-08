# Orders — Design Spec

Order management for both renters and organizations: list pages, detail pages with status timeline and actions, navigation integration, and org listing preview integration. Chat is deferred — placeholder panel only.

---

## Scope

**In scope:**
- Renter order list (`/orders`) and detail (`/orders/[id]`) pages
- Org order list (`/org/orders`) and detail (`/org/orders/[id]`) pages
- Order table, filters, status stepper, actions bar, offer form, offer details
- Navigation: "Orders" in org sidebar, verify "My Orders" in user menu
- Orders section on org listing preview page (`/org/listings/[id]`)
- Chat placeholder panel (right column on detail pages)

**Out of scope:**
- Real-time chat (WebSocket, messages, typing indicators) — placeholder only
- Notifications / unread message badges
- Changes to existing `OrderForm` on listing detail page

---

## 1. Types & API Layer

### New/Extended Types (`src/types/order.ts`)

```typescript
// Already exists: OrderStatus, OrderRead, OrderCreate

// New
interface OrderOffer {
  offered_cost: string;
  offered_start_date: string; // YYYY-MM-DD
  offered_end_date: string;   // YYYY-MM-DD
}

interface OrderListParams {
  cursor?: string;
  limit?: number;
  status?: OrderStatus;
  listing_id?: string;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
  search?: string;
}
```

### Extended API (`src/lib/api/orders.ts`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `list(token, params)` | GET | `/orders/` |
| `get(token, orderId)` | GET | `/orders/{id}` |
| `accept(token, orderId)` | PATCH | `/orders/{id}/accept` |
| `cancel(token, orderId)` | PATCH | `/orders/{id}/cancel` |
| `orgList(token, orgId, params)` | GET | `/organizations/{orgId}/orders/` |
| `orgGet(token, orgId, orderId)` | GET | `/organizations/{orgId}/orders/{id}` |
| `orgOffer(token, orgId, orderId, data)` | PATCH | `/organizations/{orgId}/orders/{id}/offer` |
| `orgApprove(token, orgId, orderId)` | PATCH | `/organizations/{orgId}/orders/{id}/approve` |
| `orgCancel(token, orgId, orderId)` | PATCH | `/organizations/{orgId}/orders/{id}/cancel` |

Follows existing `apiClient` patterns (typed generics, auto-auth, error class).

### Validators (`src/lib/validators/order.ts`)

Add `orderOfferSchema` — Zod schema: `offered_cost` > 0, `offered_start_date` < `offered_end_date`.

---

## 2. Shared Components

### `OrderTable`

Reusable table with configurable columns. Rows clickable → navigate to order detail.

| Column | Renter list | Org list | Org listing preview |
|--------|-------------|----------|---------------------|
| Listing (thumbnail + name) | Yes | Yes | No (redundant) |
| Requester name | No | Yes | Yes |
| Status badge | Yes | Yes | Yes |
| Dates | Yes | Yes | Yes |
| Cost | Yes | Yes | Yes |
| Order ID | Yes | Yes | Yes |

- Controlled via `variant` prop: `"renter"` | `"org"` | `"org-listing"` — determines which columns render
- Mobile: collapses to card layout (same pattern as org listings table)
- Cursor pagination via "Load more" button

### `OrderFilters`

Filter bar above the table. Synced to URL query params (shareable, back-button friendly).

- Status dropdown — single select or "All"
- Date range picker — from/to date inputs
- Search input — debounced, by order ID or listing name

Not rendered on org listing preview (table shown directly with `listing_id` pre-set).

### `OrderStatusStepper`

Horizontal step indicator at the top of order detail pages.

Steps: `Pending → Offered → Accepted → Confirmed → Active → Finished`

- Current step: black fill
- Completed steps: checkmark
- Future steps: gray outline
- Terminal states (Canceled, Expired): red badge replaces the stepper tail at the exit point
- Mobile: current step label + compact progress indicator

### `OrderActionsBar`

Sticky bar below the stepper. Context-aware buttons by role and status.

**Renter actions:**

| Status | Actions |
|--------|---------|
| PENDING | Cancel |
| OFFERED | Accept, Cancel |
| ACCEPTED | Cancel |
| CONFIRMED | Cancel |
| ACTIVE | Cancel |

**Org actions:**

| Status | Actions |
|--------|---------|
| PENDING | Make Offer, Cancel |
| OFFERED | Re-offer, Cancel |
| ACCEPTED | Approve, Re-offer, Cancel |
| CONFIRMED | Cancel |
| ACTIVE | Cancel |

- Cancel uses `ConfirmDialog` (renter: "Are you sure you want to cancel this order?", org: "Are you sure you want to cancel this order? The renter will be notified.")
- Accept and Approve are direct actions (no confirmation — positive, low risk)
- "Make Offer" / "Re-offer" expands `OfferForm` inline below the bar

### `OfferForm`

Inline expansion below `OrderActionsBar`.

- Fields: offered cost (number input), offered start date, offered end date (date pickers)
- Pre-filled with current offer values on re-offer, or with requested values on first offer
- Zod validation via `orderOfferSchema`
- Submit button with loading state
- Collapses on cancel or successful submit

### `OfferDetails`

Displayed on order detail when an offer exists (status OFFERED or later with offer data).

- Side-by-side comparison: requested vs offered (dates + cost)
- Changed values highlighted (bold or colored diff)

### `ChatPlaceholder`

Right panel on order detail pages. Maintains two-column layout for future chat integration.

- Fixed-height panel with border
- "Chat coming soon" message centered
- Matches the width/position that chat will occupy

---

## 3. Pages

### `/orders` — Renter Order List

- Client component, auth-gated
- `OrderFilters` + `OrderTable` (renter variant) + cursor pagination
- `useInfiniteQuery` with `ordersApi.list()`
- Query key: `["orders", { status, date_from, date_to, search }]`
- Empty state: "You haven't placed any orders yet" + "Browse catalog" CTA
- Skeleton table during loading

### `/orders/[id]` — Renter Order Detail

- Client component, auth-gated
- Two-column layout: order info (left ~60%) + chat placeholder (right ~40%)
- Left column top-to-bottom:
  1. Back link to `/orders`
  2. `OrderStatusStepper`
  3. `OrderActionsBar` (renter actions)
  4. `OfferDetails` (visible when offer exists)
  5. Order info card: listing thumbnail+name (links to listing detail), requested dates, estimated cost, order ID, created date
- Right column: `ChatPlaceholder`
- Mobile: single column, chat placeholder at the bottom
- `useQuery` with `ordersApi.get()`, key: `["order", orderId]`
- Mutations invalidate `["order", orderId]` and `["orders"]`

### `/org/orders` — Org Order List

- Client component, auth-gated (any org member)
- `OrderFilters` + `OrderTable` (org variant with requester column) + cursor pagination
- `useInfiniteQuery` with `ordersApi.orgList()`
- Query key: `["org-orders", orgId, { status, date_from, date_to, search }]`
- Empty state: "No incoming orders yet"
- Skeleton table during loading

### `/org/orders/[id]` — Org Order Detail

- Client component, auth-gated (any org member)
- Two-column layout: same structure as renter detail
- Left column differences:
  1. Back link to `/org/orders`
  2. `OrderStatusStepper`
  3. `OrderActionsBar` (org actions)
  4. `OfferForm` (expands inline from actions bar)
  5. `OfferDetails` (visible when offer exists)
  6. Order info card + requester info (name, email, phone)
- Right column: `ChatPlaceholder`
- `useQuery` with `ordersApi.orgGet()`
- Mutations use org-scoped endpoints
- On successful approve: also invalidates `["reservations", listingId]` (new reservation created)

---

## 4. Navigation & Integration

### Org Sidebar (`org-sidebar.tsx`)

Add "Orders" nav item between "Listings" and "Members". Icon: `ShoppingCart` or `ClipboardList` (match existing style). Visible to all org members.

### User Menu

Verify existing "My Orders" link points to `/{locale}/orders` and works correctly.

### Org Listing Preview (`/org/listings/[id]`)

Add "Orders" section below existing listing details:
- Section header: "Orders" with count badge
- `OrderTable` (org listing preview variant — no listing column, has requester column)
- Pre-set `listing_id` filter, no `OrderFilters` bar
- Rows link to `/org/orders/[orderId]`
- Shows latest 10, cursor paginated with "Load more"
- Empty state: "No orders for this listing yet"
- `useInfiniteQuery` with `ordersApi.orgList(token, orgId, { listing_id })`
- Query key: `["org-orders", orgId, { listing_id: listingId }]`

---

## 5. Status Colors & Error Handling

### Status Badge Colors

| Status | Color | EN | RU |
|--------|-------|----|----|
| pending | amber | Pending | Ожидает |
| offered | blue | Offered | Предложение |
| accepted | indigo | Accepted | Принято |
| confirmed | emerald | Confirmed | Подтверждено |
| active | green | Active | Активен |
| finished | gray | Finished | Завершён |
| canceled_by_user | red | Canceled | Отменён |
| canceled_by_organization | red | Canceled | Отменён |
| expired | zinc/muted | Expired | Истёк |

### Confirmation Dialogs

| Action | Side | Message |
|--------|------|---------|
| Cancel order | Renter | "Are you sure you want to cancel this order?" |
| Cancel order | Org | "Are you sure you want to cancel this order? The renter will be notified." |
| Accept offer | Renter | No confirmation (positive action) |
| Approve order | Org | No confirmation (positive action) |

### Error Handling

| Error | Handling |
|-------|----------|
| 409 on approve (date overlap) | Toast: "Cannot approve — dates overlap with an existing reservation" |
| 400 on invalid transition | Toast with backend error message |
| 404 order not found | Full-page "Not found" with back link |
| Generic server error | Toast: "Something went wrong, please try again" |
