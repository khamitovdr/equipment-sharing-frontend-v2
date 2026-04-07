# Equip Me — Implementation Slices

Overview of all frontend implementation slices. Each slice is a self-contained unit of work with its own spec → plan → implementation cycle.

**Backend:** `https://api.equip-me.ru/` — OpenAPI spec at `https://api.equip-me.ru/openapi.json`

---

## Slice A: Foundation + Auth + Catalog ✅

**Status:** Complete

App skeleton, i18n (ru/en), authentication, and all public-facing pages.

**Pages:** Home, Catalog, Listing Detail, Organization Public Profile, Login, Register

**Key components:** PublicNavbar, Footer, LocaleSwitcher, UserMenu, ListingCard, ListingGrid, CatalogFilters, MediaCarousel, ReservationCalendar

**Spec:** `docs/superpowers/specs/2026-04-05-slice-a-foundation-auth-catalog-design.md`

---

## Slice B: User Profile & Settings

**Status:** Not started

User account area — profile viewing/editing, password change, profile photo upload.

**Pages:**
- `/[locale]/settings` — user profile settings (name, email, phone, photo, password)

**API endpoints:**
- `GET /api/v1/users/me` — fetch current user
- `PATCH /api/v1/users/me` — update profile fields, change password (`password` + `new_password`), set profile photo (`profile_photo_id`)
- `POST /api/v1/media/upload-url` — request presigned URL for photo upload (kind: `photo`, context: `user_profile`)
- `POST /api/v1/media/{media_id}/confirm` — confirm upload completed
- `GET /api/v1/media/{media_id}/status` — poll processing status

**Features:**
- Edit name, surname, middle name
- Edit email and phone
- Change password (requires current password)
- Upload/change profile photo via presigned URL flow
- Form validation with zod + react-hook-form

---

## Slice C: Orders + Chat

**Status:** Not started

Order management and real-time messaging between renters and equipment owners.

**Pages:**
- `/[locale]/orders` — order list (filterable by status)
- `/[locale]/orders/[id]` — order detail with status timeline
- Chat panel (embedded in order detail or standalone)

**Features:**
- Create reservation/order from listing detail
- Order status tracking (pending → confirmed → active → completed/cancelled)
- Real-time chat via WebSocket
- Notification indicators for unread messages

---

## Slice D: Org Dashboard

**Status:** Not started

Organization management interface for equipment owners.

**Pages:**
- `/[locale]/dashboard` — org overview
- `/[locale]/dashboard/listings` — listings CRUD
- `/[locale]/dashboard/listings/new` — create listing
- `/[locale]/dashboard/listings/[id]/edit` — edit listing
- `/[locale]/dashboard/orders` — incoming orders
- `/[locale]/dashboard/members` — member management
- `/[locale]/dashboard/settings` — org settings

**Features:**
- Organization creation flow
- Listings CRUD with media upload (photos/videos)
- Incoming order management (accept/reject/complete)
- Member invites and role management
- Org profile settings (name, description, logo, contacts)

**Layout:** Sidebar navigation (`(dashboard)` layout group)

---

## Slice E: Admin + Polish

**Status:** Not started

Platform administration and quality improvements.

**Pages:**
- `/[locale]/admin/users` — user management
- `/[locale]/admin/organizations` — org management

**Features:**
- User/org moderation (suspend, role changes)
- SEO structured data (JSON-LD for listings)
- Dark mode support
- Accessibility audit and fixes
- Performance optimization

**Layout:** Admin sidebar navigation (`(admin)` layout group)
