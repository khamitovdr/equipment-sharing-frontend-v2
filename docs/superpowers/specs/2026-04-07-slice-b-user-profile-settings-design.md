# Slice B: User Profile & Settings — Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Backend:** `https://api.equip-me.ru/` — OpenAPI spec at `https://api.equip-me.ru/openapi.json`

---

## Overview

A single settings page where authenticated users can edit their profile (name, email, phone, photo) and change their password. Lives under the existing public layout with navbar and footer.

---

## Route & Layout

**Route:** `app/[locale]/(public)/settings/page.tsx`

- Reuses `(public)` layout → `PublicNavbar` + `Footer` automatically
- Client component (`"use client"`) — needs hooks for auth, forms, mutations
- Auth guard: `useAuth()` check on mount → redirect to `/[locale]/login` if not authenticated; render nothing while redirecting
- Page content centered with `max-w-xl mx-auto`
- Page title via i18n: `settings.title`

No new layout files needed.

---

## Page Composition

Three stacked sections on a single scrollable page:

### 1. Avatar Section (`components/settings/avatar-section.tsx`)

- Reuses existing `AvatarUpload` component in immediate mode (auto-uploads on file select)
- Shows current profile photo (or initials fallback) + user name + "Change photo" button
- Upload flow:
  1. `mediaApi.requestUploadUrl(token, { kind: "photo", context: "user_profile", ... })`
  2. XHR PUT to presigned URL (with progress tracking)
  3. `mediaApi.confirm(token, mediaId)`
  4. Poll `mediaApi.status(token, mediaId)` until `ready`
  5. `usersApi.update(token, { profile_photo_id: mediaId })`
  6. Update auth store with new user data
- Steps 1–4 handled by existing `AvatarUpload`; step 5–6 wired by `avatar-section.tsx`
- Wrapped in a card matching other sections

### 2. Profile Form (`components/settings/profile-form.tsx`)

- Single card with 5 fields:
  - `name` + `surname` side by side (2-col grid)
  - `middle_name` full-width
  - `email` full-width
  - `phone` full-width (formatted input)
- Pre-filled from `useAuth().user`
- "Save" button at card bottom
- On submit: `PATCH /users/me` with only changed fields
- On success: toast notification, update auth store with response
- On 409 (email taken): field-level error on email

### 3. Password Form (`components/settings/password-form.tsx`)

- Separate card with 3 fields:
  - `current password`
  - `new password`
  - `confirm new password` (frontend-only, not sent to API)
- "Update Password" button at card bottom
- On submit: `PATCH /users/me` with `{ password, new_password }`
- On success: toast notification, clear all form fields
- On 401/403 (wrong current password): field-level error on current password

---

## Phone Input Formatter (`components/shared/phone-input.tsx`)

Wraps the existing `Input` component with formatting logic.

- Auto-formats as user types into `+7 (XXX) XXX-XX-XX`
- Smart start behavior:
  - `8` → `+7`
  - `9` → `+7 (9`
  - `+7` → `+7`
- Only accepts digits — strips non-numeric input
- Cursor position maintained correctly after formatting
- Max 10 digits after `+7` (18 chars formatted)
- Reusable — lives in `components/shared/` for use in register form and future org contacts (Slice D)

---

## Validation

### Profile Schema (`lib/validators/settings.ts`)

| Field | Rules |
|-------|-------|
| `name` | Required, min 1 character |
| `surname` | Required, min 1 character |
| `middle_name` | Optional (empty string allowed) |
| `email` | Required, valid email format |
| `phone` | Required, matches `+7 (XXX) XXX-XX-XX` pattern: `\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}` |

### Password Schema (`lib/validators/settings.ts`)

Uses a shared password validator defined in `lib/validators/shared.ts` (reusable by register form).

| Field | Rules |
|-------|-------|
| `password` (current) | Required |
| `new_password` | Required + password strength rules (see below) |
| `confirm_password` | Required, must match `new_password` |

**Password strength rules** (each a separate `.refine()` for specific error messages):

1. At least 8 characters
2. At least one lowercase letter (Latin `a-z` OR Cyrillic `а-яё`)
3. At least one uppercase letter (Latin `A-Z` OR Cyrillic `А-ЯЁ`)
4. At least one digit (`0-9`)

---

## Data Flow & State Management

### Fetching User Data

- `useAuth().user` provides the current user from the Zustand auth store (loaded on app hydration)
- No additional fetch on mount
- After any mutation: update auth store with the `UserRead` response from `PATCH /users/me`

### Profile Mutation (`lib/hooks/use-update-profile.ts`)

```
PATCH /users/me → { name?, surname?, middle_name?, email?, phone? }
```

- Sends only changed fields (diff against current user)
- On success: `authStore.setAuth(updatedUser, token)` + toast
- On 409: `setError("email", { message: t("settings.validation.emailTaken") })`
- On other errors: toast with generic error message

### Password Mutation (`lib/hooks/use-change-password.ts`)

```
PATCH /users/me → { password, new_password }
```

- On success: toast + `reset()` (clear all fields)
- On 401/403: `setError("password", { message: t("settings.validation.wrongPassword") })`
- On other errors: toast with generic error message

### Avatar Flow

Handled by existing `AvatarUpload` component + `avatar-section.tsx` wiring the final `PATCH /users/me` with `profile_photo_id`.

---

## API Endpoints Used

### `GET /api/v1/users/me`

Already used by auth hydration. No new calls needed.

### `PATCH /api/v1/users/me`

**Request body (`UserUpdate`):**

| Field | Type | Notes |
|-------|------|-------|
| `email` | string (email) \| null | Optional |
| `phone` | string \| null | Optional, formatted as `+7 (XXX) XXX-XX-XX` |
| `name` | string \| null | Optional |
| `surname` | string \| null | Optional |
| `middle_name` | string \| null | Optional |
| `password` | string \| null | Current password (for password change) |
| `new_password` | string \| null | New password |
| `profile_photo_id` | string (uuid) \| null | Set to media ID or null to remove |

**Response:** `UserRead`

### Media Endpoints (for avatar upload)

- `POST /api/v1/media/upload-url` — request presigned URL (`kind: "photo"`, `context: "user_profile"`)
- `POST /api/v1/media/{media_id}/confirm` — confirm upload completed
- `GET /api/v1/media/{media_id}/status` — poll processing status

Already implemented in `lib/api/media.ts`.

---

## Error Handling & Edge Cases

### Auth Guard
- On mount, if `!isAuthenticated` → `router.replace(/[locale]/login)`
- Render nothing while redirecting to avoid flash of form content

### Form UX
- Save buttons disabled while `isSubmitting` (prevents double-submit)
- Save buttons disabled when form is pristine (`!isDirty`)
- On successful profile save, `reset()` with new values so `isDirty` resets correctly
- Focus moves to first error field on validation failure

### Optimistic Updates
- None. Mutations are sub-second; show loading spinner on the save button during mutation.

### Accessibility
- `aria-invalid` on fields with errors
- `aria-describedby` linking inputs to error messages
- Form sections use `<fieldset>` + `<legend>` for screen readers

---

## i18n Keys

Add to both `ru.json` and `en.json` under `settings`:

```
settings.title
settings.avatar.change
settings.profile (section heading)
settings.name
settings.surname
settings.middleName
settings.email
settings.phone
settings.save
settings.password.title
settings.password.current
settings.password.new
settings.password.confirm
settings.password.update
settings.password.success
settings.profile.success
settings.validation.emailTaken
settings.validation.wrongPassword
settings.validation.passwordMinLength
settings.validation.passwordLowercase
settings.validation.passwordUppercase
settings.validation.passwordDigit
settings.validation.passwordMismatch
```

---

## New Files

| File | Purpose |
|------|---------|
| `app/[locale]/(public)/settings/page.tsx` | Settings page — composes the three sections |
| `components/settings/avatar-section.tsx` | Avatar display + upload wiring |
| `components/settings/profile-form.tsx` | Profile edit form |
| `components/settings/password-form.tsx` | Password change form |
| `components/shared/phone-input.tsx` | Phone number formatter (`+7 (XXX) XXX-XX-XX`) |
| `lib/validators/settings.ts` | Zod schemas for profile + password forms |
| `lib/validators/shared.ts` | Shared password strength validator |
| `lib/hooks/use-update-profile.ts` | React Query mutation for profile update |
| `lib/hooks/use-change-password.ts` | React Query mutation for password change |
