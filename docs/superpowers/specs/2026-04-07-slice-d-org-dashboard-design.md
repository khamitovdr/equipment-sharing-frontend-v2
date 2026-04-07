# Slice D: Org Dashboard — Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Backend:** `https://api.equip-me.ru/` — OpenAPI spec at `https://api.equip-me.ru/openapi.json`

---

## Overview

Organization management interface: creation flow, dashboard with sidebar navigation, listings CRUD with photo upload, member management, and org settings. Org orders management is excluded (deferred to Slice C).

---

## 1. Org Context Store

New Zustand store (`lib/stores/org-store.ts`) persisted to localStorage (`equip-me-org`):

| Field | Type | Description |
|-------|------|-------------|
| `currentOrg` | `OrganizationRead \| null` | Active organization |
| `membership` | `MembershipRead \| null` | Current user's membership in active org |
| `organizations` | `MembershipRead[]` | All of user's memberships |
| `switchOrg(orgId)` | function | Sets active org + membership, invalidates org-scoped queries |
| `setOrganizations(memberships)` | function | Bulk set from API |
| `clearOrgContext()` | function | Reset on logout |

**Hydration:** On dashboard layout mount, fetch `GET /users/me/organizations`. Auto-select last-used org from localStorage, or first org if none saved. If user has no orgs, redirect to `/organizations/new`.

---

## 2. Dashboard Layout & Routing

### Layout (`app/[locale]/(dashboard)/layout.tsx`)

- Client component with auth guard (same pattern as settings page)
- Org context guard: fetches memberships on mount → if none, redirect to `/(public)/organizations/new`
- Renders: `OrgSidebar` (left, 240px) + scrollable main content (right, flex-1)
- Wraps children with org context provider

### OrgSidebar (`components/layout/org-sidebar.tsx`)

**Structure (top to bottom):**

1. **Org header** — org photo (or initials fallback) + short name + current user's role badge
2. **Nav links:**
   - Listings (`/org/listings`) — icon: LayoutGrid
   - Members (`/org/members`) — icon: Users
   - Settings (`/org/settings`) — icon: Settings (visible to admin only)
3. **Org switcher** (bottom) — dropdown showing all user's orgs, click to switch. Triggers `switchOrg()` which invalidates all org-scoped TanStack Query keys.

**Responsive behavior:**
- Desktop (>1024px): persistent sidebar
- Mobile/tablet: hidden by default, hamburger button in mobile header opens sidebar as sheet overlay with backdrop

### Routes

All under `app/[locale]/(dashboard)/org/`:

| Route | Page | Min Role | Component |
|-------|------|----------|-----------|
| `/org/listings` | Listing table | viewer | `org/listings/page.tsx` |
| `/org/listings/new` | Create listing | editor | `org/listings/new/page.tsx` |
| `/org/listings/[id]/edit` | Edit listing | editor | `org/listings/[id]/edit/page.tsx` |
| `/org/members` | Member management | viewer | `org/members/page.tsx` |
| `/org/members/invite` | Invite member | admin | `org/members/invite/page.tsx` |
| `/org/settings` | Org settings | admin | `org/settings/page.tsx` |

**Role-based access:** Pages requiring higher roles than the user's membership redirect to `/org/listings` with a permission toast.

---

## 3. Org Creation (`app/[locale]/(public)/organizations/new/page.tsx`)

Lives under the `(public)` layout (user has no org context yet). Auth-gated.

### Page Composition

Single card with three stacked sections:

**Section 1: INN/Name Search**
- `DadataSuggest` component (`components/org/dadata-suggest.tsx`)
- Text input, debounced 300ms → `POST /api/dadata/suggest` (Next.js proxy route)
- Dropdown shows matches: org name + INN + address preview
- On select → auto-fills read-only fields below: full name, short name, INN, legal address, manager name
- User must select from suggestions (cannot manually enter INN)

**Section 2: Org Photo**
- Reuses `AvatarUpload` component with context `org_profile`
- Optional

**Section 3: Contacts**
- `ContactsEditor` component (`components/org/contacts-editor.tsx`)
- Dynamic list of contact rows: display name (required) + phone (optional, `PhoneInput`) + email (optional)
- Add button to append rows, remove button per row (minimum 1 enforced)

### Dadata Proxy

**Route:** `app/api/dadata/suggest/route.ts`

- `POST` handler accepting `{ query: string }`
- Forwards to Dadata suggestions API (`https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party`) with server-side API key from `DADATA_API_KEY` env var
- Returns array of suggestions with structured org data (name, INN, address, manager, etc.)
- No auth required on the proxy (the page itself is auth-gated)

### Submit Flow

1. Validate: INN selected (required), at least 1 contact with display name
2. `POST /api/v1/organizations/` with `{ inn, contacts }`
3. If photo uploaded: `PATCH /api/v1/organizations/{id}/photo` with `{ photo_id }`
4. Fetch fresh memberships → populate org context store
5. Redirect to `/org/settings` with success toast

### Validation (`lib/validators/organization.ts`)

| Field | Rules |
|-------|-------|
| `inn` | Required (set on Dadata selection) |
| `contacts` | Array, min length 1 |
| `contacts[].display_name` | Required, min 1 character |
| `contacts[].phone` | Optional, if provided must match `+7 (XXX) XXX-XX-XX` |
| `contacts[].email` | Optional, if provided must be valid email |

---

## 4. Join Organization Flow

**Trigger:** "Join organization" item in `UserMenu` dropdown (already exists in nav spec).

**Implementation:** modal dialog (`components/org/join-org-dialog.tsx`)

1. Search input — queries `GET /api/v1/organizations/?search=<query>` (public endpoint), debounced 300ms
2. Dropdown shows org cards: photo, short name, INN
3. On select → `POST /api/v1/organizations/{org_id}/members/join`
4. Success toast: "Request sent, waiting for admin approval"
5. Close dialog
6. Error 409: "You are already a member or have a pending request"

---

## 5. Listings CRUD

### Listings Table (`app/[locale]/(dashboard)/org/listings/page.tsx`)

- Header: "Listings" title + "Create listing" button (visible to editor+)
- Filter row: search input (debounced 300ms) + category dropdown + status filter (all / hidden / published / archived)
- Desktop: table with columns — photo thumbnail (40x40), name, category, price, status badge, actions menu ("...")
- Mobile: card list — name, category + price on second line, status badge
- Actions menu per row: Edit, Change status (submenu: publish/hide/archive based on current), Delete (with confirmation dialog)
- Status change calls `PATCH /api/v1/organizations/{orgId}/listings/{listingId}/status` with `{ status }` directly from the list
- Cursor-paginated with "Load more" button
- Click row → navigate to edit page
- Empty state: "No listings yet" + "Create your first listing" CTA (editor+)

**Query:** `GET /api/v1/organizations/{orgId}/listings/` with `useInfiniteQuery`, key `["org-listings", orgId, filters]`, stale time 30s.

**Status transitions allowed:**
- `hidden` → `published`
- `published` → `hidden`, `archived`
- `archived` → `hidden`

### Create Listing (`app/[locale]/(dashboard)/org/listings/new/page.tsx`)

Single scrollable form with sections:

**Section 1: Basic Info**
- `name` — text input, required
- `category` — select dropdown with "Create new" option at bottom. Categories fetched via `GET /api/v1/organizations/{orgId}/listings/categories/available/` (auth required). "Create new" opens inline text input → `POST /api/v1/organizations/{orgId}/listings/categories/` → new category auto-selected
- `price` — number input, required, > 0, label "Price per day"

**Section 2: Description**
- `description` — textarea, optional. Hint: "Supports Markdown"

**Section 3: Specifications**
- Dynamic key-value pair list (`components/org/specs-editor.tsx`)
- Each row: key input + value input + remove button
- Add row button
- Optional (can submit with no specs)

**Section 4: Service Flags**
- Checkboxes: with operator, on owner's site, delivery, installation, setup
- All default to `false`

**Section 5: Photos**
- `PhotoGrid` component (`components/org/photo-grid.tsx`)
- Drop zone + "Browse" button to upload photos
- Max 10 photos. Shows count: "3 / 10 photos"
- On file select: validate type (image/jpeg, image/png, image/webp) + size (max 10MB)
- Upload via presigned URL flow (same as avatar): request URL → PUT to S3 → confirm → poll status → on ready, append thumbnail to grid
- Drag-and-drop reorder via `@dnd-kit/core` — order in grid determines `photo_ids` array order
- Remove button (X) per photo
- Shows upload progress per photo being uploaded

**Submit flow:**
1. Zod validation
2. `POST /api/v1/organizations/{orgId}/listings/` with form data + `photo_ids: [ordered array]`
3. New listing status defaults to `hidden`
4. Redirect to edit page with success toast

### Edit Listing (`app/[locale]/(dashboard)/org/listings/[id]/edit/page.tsx`)

Same form as create, pre-filled. Additional controls:

- **Status badge + change dropdown** at top of page (same transitions as table)
- **Delete button** at bottom: confirmation dialog → `DELETE /api/v1/organizations/{orgId}/listings/{id}` → redirect to listings table
- Save sends `PATCH /api/v1/organizations/{orgId}/listings/{id}` with changed fields + full `photo_ids` array (always sent as full replacement)

**Query:** fetch listing data with `useQuery`, key `["org-listing", orgId, listingId]`.

### Validation (`lib/validators/listing.ts`)

| Field | Rules |
|-------|-------|
| `name` | Required, min 1 character |
| `category_id` | Required (UUID) |
| `price` | Required, number > 0 |
| `description` | Optional string |
| `specifications` | Optional record, keys and values are non-empty strings if provided |
| `photo_ids` | Array of UUIDs, max length 10 |
| Service flags | Booleans, default false |

---

## 6. Member Management

### Members Page (`app/[locale]/(dashboard)/org/members/page.tsx`)

Tabbed layout with three tabs. All data from single endpoint: `GET /api/v1/organizations/{orgId}/members`, filtered client-side by status.

**Query:** `useInfiniteQuery`, key `["members", orgId]`, stale time 30s.

**User details:** `MembershipRead` only contains `user_id` — no name, email, or avatar. For each page of members, fetch user details in parallel via `GET /api/v1/users/{user_id}`. Cache aggressively with key `["user", userId]`, stale time 300s. Use `useQueries` to batch.

**Tab 1: Members** (status `member`)
- Table: avatar, name (from user data), email, role badge (admin/editor/viewer), joined date
- Actions column (admin only):
  - Role dropdown → `PATCH /api/v1/organizations/{orgId}/members/{memberId}/role` with `{ role }`
  - Remove button → confirmation dialog → `DELETE /api/v1/organizations/{orgId}/members/{memberId}`
- Cannot change own role or remove self

**Tab 2: Pending Requests** (status `candidate`)
- Table: avatar, name, email, requested date
- Actions (admin only):
  - Approve → role select popover (admin/editor/viewer, default viewer) → `PATCH .../members/{id}/approve` with `{ role }`
  - Reject → `DELETE .../members/{id}`
- Empty state: "No pending requests"

**Tab 3: Invitations** (status `invited`)
- Table: avatar, name, email, invited role, sent date
- Actions (admin only): Cancel invitation → `DELETE .../members/{id}`
- Empty state: "No pending invitations" + "Invite a member" link (admin only)

### Invite Page (`app/[locale]/(dashboard)/org/members/invite/page.tsx`)

Admin only.

1. **User search** — email input, debounced 300ms → `GET /api/v1/users/search?email=<query>&limit=5` (auth required, min 3 chars)
2. Dropdown shows matching users: avatar, full name, email
3. On select → user card appears below input (avatar + name + email), with X to clear
4. **Role select** — radio group or select: admin / editor / viewer (default: viewer)
5. Submit → `POST /api/v1/organizations/{orgId}/members/invite` with `{ user_id, role }`
6. Success toast → redirect to members page (Invitations tab)
7. Error 409 → "User is already a member or has a pending invitation/request"

---

## 7. Org Settings (`app/[locale]/(dashboard)/org/settings/page.tsx`)

Admin only. Two stacked cards:

### Card 1: Organization Profile

- **Org photo** — `AvatarUpload` component. On upload complete → `PATCH /api/v1/organizations/{orgId}/photo` with `{ photo_id }`. To remove → same endpoint with `{ photo_id: null }`.
- **Read-only info** below: full name, short name, INN, legal address, manager name, registration date, status badge (created/verified). Displayed as a definition list. Not editable (sourced from Dadata/backend).

### Card 2: Contacts

- `ContactsEditor` component (reused from org creation)
- Pre-filled from `currentOrg.contacts`
- Same UX: dynamic rows, add/remove, min 1
- Save button → `PUT /api/v1/organizations/{orgId}/contacts` with `{ contacts: [...] }` (full replacement)
- Zod validation: same schema as org creation contacts
- Success toast on save, form resets dirty state

---

## 8. New Types

### `src/types/organization.ts` (extend existing)

```
MembershipRole = "admin" | "editor" | "viewer"
MembershipStatus = "candidate" | "invited" | "member"

MembershipRead {
  id: string
  user_id: string
  organization_id: string
  role: MembershipRole
  status: MembershipStatus
  created_at: string
  updated_at: string
}
```

### `src/types/listing.ts` (extend existing)

```
ListingCreate {
  name: string
  category_id: string
  price: number
  description?: string
  specifications?: Record<string, string>
  with_operator?: boolean
  on_owner_site?: boolean
  delivery?: boolean
  installation?: boolean
  setup?: boolean
  photo_ids?: string[]
}

ListingUpdate = Partial<ListingCreate>

ListingStatusUpdate {
  status: ListingStatus
}
```

### `src/types/dadata.ts` (new)

```
DadataSuggestion {
  value: string           // display name
  data: {
    inn: string
    name: { full_with_opf: string, short_with_opf: string }
    address: { value: string }
    management?: { name: string }
    state?: { registration_date?: number }
  }
}
```

---

## 9. API Endpoints Used

### Organizations

| Method | Path | Auth | Used In |
|--------|------|------|---------|
| `POST` | `/api/v1/organizations/` | Yes | Org creation |
| `GET` | `/api/v1/organizations/` | No | Join org search |
| `GET` | `/api/v1/organizations/{org_id}` | No | Org context hydration |
| `PATCH` | `/api/v1/organizations/{org_id}/photo` | Yes | Org creation, settings |
| `PUT` | `/api/v1/organizations/{org_id}/contacts` | Yes | Org settings |

### Members

| Method | Path | Auth | Used In |
|--------|------|------|---------|
| `GET` | `/api/v1/organizations/{org_id}/members` | Yes | Members page |
| `POST` | `/api/v1/organizations/{org_id}/members/invite` | Yes | Invite page |
| `POST` | `/api/v1/organizations/{org_id}/members/join` | Yes | Join dialog |
| `PATCH` | `/api/v1/organizations/{org_id}/members/{id}/approve` | Yes | Pending tab |
| `PATCH` | `/api/v1/organizations/{org_id}/members/{id}/role` | Yes | Members tab |
| `DELETE` | `/api/v1/organizations/{org_id}/members/{id}` | Yes | All tabs |

### Listings

| Method | Path | Auth | Used In |
|--------|------|------|---------|
| `GET` | `/api/v1/organizations/{org_id}/listings/` | Yes | Listings table |
| `POST` | `/api/v1/organizations/{org_id}/listings/` | Yes | Create listing |
| `PATCH` | `/api/v1/organizations/{org_id}/listings/{id}` | Yes | Edit listing |
| `DELETE` | `/api/v1/organizations/{org_id}/listings/{id}` | Yes | Edit/table delete |
| `PATCH` | `/api/v1/organizations/{org_id}/listings/{id}/status` | Yes | Table/edit status change |
| `GET` | `/api/v1/organizations/{org_id}/listings/categories/available/` | Yes | Listing form category select |
| `POST` | `/api/v1/organizations/{org_id}/listings/categories/` | Yes | Inline category creation |

### Users

| Method | Path | Auth | Used In |
|--------|------|------|---------|
| `GET` | `/api/v1/users/me/organizations` | Yes | Org context hydration |
| `GET` | `/api/v1/users/{user_id}` | No | Member user details |
| `GET` | `/api/v1/users/search?email=&limit=` | Yes | Invite user search |

### Media

| Method | Path | Auth | Used In |
|--------|------|------|---------|
| `POST` | `/api/v1/media/upload-url` | Yes | Photo uploads |
| `POST` | `/api/v1/media/{id}/confirm` | Yes | Photo uploads |
| `GET` | `/api/v1/media/{id}/status` | Yes | Photo uploads |

### External (proxied)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/dadata/suggest` (Next.js route) | Dadata party suggestions |

---

## 10. TanStack Query Keys

| Key | Scope | Stale Time |
|-----|-------|------------|
| `["user-organizations"]` | Dashboard hydration | 60s |
| `["org-listings", orgId, filters]` | Listings table | 30s |
| `["org-listing", orgId, listingId]` | Edit listing | 30s |
| `["org-listing-categories", orgId]` | Category select | 60s |
| `["members", orgId]` | Members page | 30s |
| `["user", userId]` | Member user details | 300s |
| `["user-search", email]` | Invite search | 10s |
| `["media-status", mediaId]` | Upload polling | refetch every 2s while processing |

Mutations invalidate relevant queries:
- Create/update/delete listing → `["org-listings", orgId, ...]`
- Status change → `["org-listings", orgId, ...]`
- Create category → `["org-listing-categories", orgId]`
- Member actions → `["members", orgId]`
- Org photo/contacts → `["user-organizations"]`

---

## 11. Error Handling

### Auth & Permission Guards

- Dashboard layout: if `!isAuthenticated` → redirect to `/login`
- Dashboard layout: if no memberships → redirect to `/organizations/new`
- Role-gated pages (editor+, admin): if insufficient role → redirect to `/org/listings` + toast "You don't have permission"

### API Errors

| Status | Context | Handling |
|--------|---------|----------|
| 400 | Form submission | Field-level errors or validation toast |
| 401 | Any | Clear auth + org stores, redirect to `/login` |
| 403 | Role-gated action | Toast "You don't have permission" |
| 404 | Edit listing | Full-page "Listing not found" with back link |
| 409 | Invite member | "User is already a member or has a pending invitation" |
| 409 | Join org | "You already have a pending request" |
| 409 | Create org | "Organization with this INN already exists" |

### Form UX

- Save/submit buttons disabled while `isSubmitting`
- Save buttons disabled when form is pristine (`!isDirty`)
- Focus moves to first error field on validation failure
- Confirmation dialogs for destructive actions: delete listing, remove member

---

## 12. Loading & Empty States

### Loading

| Context | UX |
|---------|-----|
| Dashboard hydration | Full-page centered spinner |
| Listings table | Skeleton rows (preserve table layout) |
| Listing form (edit) | Skeleton form fields |
| Members table | Skeleton rows |
| Photo upload | Progress bar per photo, spinner during processing |
| Dadata suggest | Spinner inside input dropdown |
| User search (invite) | Spinner inside dropdown |
| Mutations | Button spinner, disabled until complete |

### Empty States

| Context | Message | CTA |
|---------|---------|-----|
| Listings — no results | "No listings yet" | "Create your first listing" (editor+) |
| Listings — filtered, no results | "No listings match your filters" | "Clear filters" |
| Members — Members tab | "No members yet" | — |
| Members — Pending tab | "No pending requests" | — |
| Members — Invitations tab | "No pending invitations" | "Invite a member" (admin) |
| User search — no results | "No users found for this email" | — |
| Dadata — no results | "No organizations found" | — |

---

## 13. i18n Keys

Add to both `ru.json` and `en.json`:

```
# Dashboard layout
dashboard.sidebar.listings
dashboard.sidebar.members
dashboard.sidebar.settings
dashboard.sidebar.switchOrg
dashboard.noOrgs (redirect message)
dashboard.permissionDenied

# Org creation
orgCreate.title
orgCreate.search.label
orgCreate.search.placeholder ("Enter organization name or INN")
orgCreate.search.noResults
orgCreate.details.fullName
orgCreate.details.shortName
orgCreate.details.inn
orgCreate.details.address
orgCreate.details.manager
orgCreate.photo.label
orgCreate.contacts.title
orgCreate.contacts.add
orgCreate.contacts.remove
orgCreate.contacts.displayName
orgCreate.contacts.phone
orgCreate.contacts.email
orgCreate.contacts.minOne
orgCreate.submit
orgCreate.success
orgCreate.error.innRequired
orgCreate.error.alreadyExists

# Join org
joinOrg.title
joinOrg.search.placeholder
joinOrg.search.noResults
joinOrg.submit
joinOrg.success
joinOrg.error.alreadyMember

# Listings
orgListings.title
orgListings.create
orgListings.search.placeholder
orgListings.filter.allStatuses
orgListings.filter.allCategories
orgListings.empty
orgListings.emptyFiltered
orgListings.actions.edit
orgListings.actions.delete
orgListings.actions.changeStatus
orgListings.actions.publish
orgListings.actions.hide
orgListings.actions.archive
orgListings.deleteConfirm
orgListings.statusChanged
orgListings.deleted

# Listing form (create/edit)
listingForm.createTitle
listingForm.editTitle
listingForm.name
listingForm.category
listingForm.categoryCreate ("Create new category")
listingForm.categoryName
listingForm.price
listingForm.pricePerDay
listingForm.description
listingForm.descriptionHint ("Supports Markdown")
listingForm.specs
listingForm.specs.key
listingForm.specs.value
listingForm.specs.add
listingForm.flags.title ("Service options")
listingForm.flags.withOperator
listingForm.flags.onOwnerSite
listingForm.flags.delivery
listingForm.flags.installation
listingForm.flags.setup
listingForm.photos
listingForm.photos.upload
listingForm.photos.limit ("3 / 10 photos")
listingForm.photos.maxReached
listingForm.photos.invalidType
listingForm.photos.tooLarge
listingForm.save
listingForm.delete
listingForm.created
listingForm.updated
listingForm.validation.nameRequired
listingForm.validation.categoryRequired
listingForm.validation.priceRequired
listingForm.validation.pricePositive

# Members
members.title
members.tabs.members
members.tabs.pending
members.tabs.invitations
members.role.admin
members.role.editor
members.role.viewer
members.actions.changeRole
members.actions.remove
members.actions.approve
members.actions.reject
members.actions.cancelInvite
members.removeConfirm ("Remove {name} from the organization?")
members.roleChanged
members.removed
members.approved
members.rejected
members.inviteCanceled
members.empty.members
members.empty.pending
members.empty.invitations

# Invite
invite.title
invite.search.label
invite.search.placeholder ("Search by email")
invite.search.noResults
invite.search.minChars ("Type at least 3 characters")
invite.role.label
invite.submit
invite.success
invite.error.alreadyMember

# Org settings
orgSettings.title
orgSettings.profile.title
orgSettings.profile.photo
orgSettings.profile.info
orgSettings.profile.fullName
orgSettings.profile.shortName
orgSettings.profile.inn
orgSettings.profile.address
orgSettings.profile.manager
orgSettings.profile.registrationDate
orgSettings.profile.status
orgSettings.contacts.title
orgSettings.contacts.save
orgSettings.contacts.saved
```

---

## 14. New Files

| File | Purpose |
|------|---------|
| **Stores** | |
| `lib/stores/org-store.ts` | Org context Zustand store |
| **Layout** | |
| `app/[locale]/(dashboard)/layout.tsx` | Dashboard layout with auth + org guards |
| `components/layout/org-sidebar.tsx` | Sidebar navigation |
| `components/layout/org-switcher.tsx` | Org switcher dropdown |
| **Org Creation** | |
| `app/[locale]/(public)/organizations/new/page.tsx` | Create organization page |
| `app/api/dadata/suggest/route.ts` | Dadata proxy API route |
| `components/org/dadata-suggest.tsx` | Dadata autocomplete input |
| `components/org/contacts-editor.tsx` | Dynamic contacts list (reused in settings) |
| `components/org/join-org-dialog.tsx` | Join organization modal |
| **Listings** | |
| `app/[locale]/(dashboard)/org/listings/page.tsx` | Listings table |
| `app/[locale]/(dashboard)/org/listings/new/page.tsx` | Create listing form |
| `app/[locale]/(dashboard)/org/listings/[id]/edit/page.tsx` | Edit listing form |
| `components/org/listing-form.tsx` | Shared create/edit listing form |
| `components/org/photo-grid.tsx` | Drag-and-drop photo grid with upload |
| `components/org/specs-editor.tsx` | Dynamic key-value spec pairs |
| `components/org/category-select.tsx` | Category select with inline create |
| `components/org/listing-status-select.tsx` | Status change dropdown |
| **Members** | |
| `app/[locale]/(dashboard)/org/members/page.tsx` | Members page with tabs |
| `app/[locale]/(dashboard)/org/members/invite/page.tsx` | Invite member page |
| `components/org/member-table.tsx` | Member table with actions |
| `components/org/user-search.tsx` | Email-based user search for invite |
| **Settings** | |
| `app/[locale]/(dashboard)/org/settings/page.tsx` | Org settings page |
| **Validators** | |
| `lib/validators/organization.ts` | Org creation + contacts Zod schemas |
| `lib/validators/listing.ts` | Listing create/edit Zod schema |
| **API** | |
| `lib/api/organizations.ts` | Extend with member, photo, contacts methods |
| `lib/api/listings.ts` | Extend with org-scoped CRUD methods |
| `lib/api/users.ts` | Extend with search + organizations methods |
| **Hooks** | |
| `lib/hooks/use-org.ts` | Org context convenience hook |
| `lib/hooks/use-org-guard.ts` | Role-based access guard hook |
| **Types** | |
| `types/organization.ts` | Extend with MembershipRead, MembershipRole, etc. |
| `types/listing.ts` | Extend with ListingCreate, ListingUpdate, etc. |
| `types/dadata.ts` | Dadata suggestion types |

### New Dependency

- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` — drag-and-drop for photo grid reordering

---

## Out of Scope

- **Org orders management** — deferred to Slice C
- **Payment details** — deferred to future work
- **Video/document upload** for listings — photos only for now
- **Org deletion** — no API endpoint
- **Notification system** — placeholder only
