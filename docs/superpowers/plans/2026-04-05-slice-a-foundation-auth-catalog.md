# Slice A: Foundation + Auth + Catalog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete foundation (Next.js 15, i18n, API client, auth) and all public-facing pages (home, catalog, listing detail, org profile) for the Equip Me equipment rental platform.

**Architecture:** Next.js 15 App Router with `[locale]` prefix for i18n (next-intl). Typed API client wrapping `fetch` against `https://api.equip-me.ru/api/v1`. Zustand for auth state, TanStack Query for server state. shadcn/ui with zinc palette, pure black accent, light-only theme.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, next-intl, React Hook Form + Zod, Embla Carousel, react-markdown + rehype-sanitize, Vitest + React Testing Library

**Design spec:** `docs/superpowers/specs/2026-04-05-slice-a-foundation-auth-catalog-design.md`
**Backend OpenAPI:** `docs/backend_openapi.json` or `https://api.equip-me.ru/openapi.json`

---

## File Map

```
src/
  app/
    [locale]/
      (public)/
        layout.tsx                     # PublicNavbar + Footer wrapper
        page.tsx                       # Home page
        listings/
          page.tsx                     # Catalog page
          [id]/page.tsx                # Listing detail page
        organizations/
          [id]/page.tsx                # Org public profile page
      (auth)/
        layout.tsx                     # Minimal centered layout
        login/page.tsx                 # Login page
        register/page.tsx              # Register page
      (dashboard)/
        layout.tsx                     # Placeholder layout
      (admin)/
        layout.tsx                     # Placeholder layout
      layout.tsx                       # Root locale layout (providers)
      not-found.tsx                    # 404 page
    layout.tsx                         # HTML root (fonts, metadata)
    globals.css                        # Tailwind + shadcn/ui theme
  components/
    ui/                                # shadcn/ui primitives (via CLI)
    catalog/
      listing-card.tsx                 # Card with hover photo scrubbing
      listing-grid.tsx                 # Responsive grid of cards
      catalog-filters.tsx              # Sidebar filters (category pills, price, flags, sort)
      search-bar.tsx                   # Debounced search input
      media-carousel.tsx               # Embla carousel for photos/videos
      listing-specs.tsx                # Key-value specs table
      listing-description.tsx          # Markdown renderer
      reservation-calendar.tsx         # Calendar with reservations + date range picker
      order-form.tsx                   # Order creation form wrapping calendar
    layout/
      public-navbar.tsx                # Top navbar
      user-menu.tsx                    # Avatar dropdown for authenticated users
      locale-switcher.tsx              # RU/EN toggle
      notification-bell.tsx            # Placeholder bell icon
      footer.tsx                       # Simple footer
    media/
      avatar-upload.tsx                # Circular photo upload for register
      upload-progress.tsx              # Progress bar + processing spinner
    shared/
      cursor-pagination.tsx            # Load more button with cursor state
      empty-state.tsx                  # Empty state with message + CTA
      status-badge.tsx                 # Colored pill badge
      confirm-dialog.tsx               # Confirmation modal
  lib/
    api/
      client.ts                        # Base fetch wrapper (auth, interceptors)
      users.ts                         # User endpoints
      listings.ts                      # Listing endpoints
      organizations.ts                 # Organization endpoints
      orders.ts                        # Order endpoints
      media.ts                         # Media endpoints
      index.ts                         # Unified api export
    hooks/
      use-auth.ts                      # Auth hook wrapping store
      use-media-upload.ts              # Media upload flow hook
    i18n/
      config.ts                        # next-intl configuration
      request.ts                       # Server-side i18n request config
      routing.ts                       # Locale routing config
      messages/
        ru.json                        # Russian translations
        en.json                        # English translations
    stores/
      auth-store.ts                    # Zustand auth store
    validators/
      auth.ts                          # Login + register Zod schemas
      listing.ts                       # Listing filter Zod schemas
      order.ts                         # Order creation Zod schema
    query/
      client.ts                        # QueryClient factory
      providers.tsx                    # QueryClientProvider wrapper
  types/
    user.ts                            # User, UserRole, ProfilePhoto types
    listing.ts                         # Listing, Category, Media types
    organization.ts                    # Organization, Contact types
    order.ts                           # Order, OrderStatus types
    media.ts                           # Media upload types
    api.ts                             # PaginatedResponse, API error types
  middleware.ts                        # next-intl middleware for locale routing
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `components.json`

- [ ] **Step 1: Initialize Next.js 15 project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --skip-install
```

Select defaults when prompted. This creates the base Next.js 15 project in the current directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install next-intl zustand @tanstack/react-query @tanstack/react-query-devtools react-hook-form @hookform/resolvers zod embla-carousel-react react-markdown rehype-sanitize lucide-react next-themes sonner date-fns
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom @testing-library/user-event
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Zinc
- CSS variables: Yes

- [ ] **Step 4: Install shadcn/ui components**

```bash
npx shadcn@latest add button input label card dialog dropdown-menu sheet separator badge select checkbox popover calendar skeleton toast sonner avatar
```

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/test/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 6: Set up environment variables**

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=https://api.equip-me.ru/api/v1
API_URL=https://api.equip-me.ru/api/v1
```

Create `.env.example`:

```
NEXT_PUBLIC_API_URL=https://api.equip-me.ru/api/v1
API_URL=https://api.equip-me.ru/api/v1
```

- [ ] **Step 7: Update globals.css for pure-black accent**

Replace the contents of `src/app/globals.css` — keep the Tailwind imports and shadcn/ui CSS variables but ensure the primary color is pure black (`#111`) and the palette uses zinc grays. Only light theme needed.

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind, shadcn/ui, and dev tooling"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/types/api.ts`, `src/types/user.ts`, `src/types/listing.ts`, `src/types/organization.ts`, `src/types/order.ts`, `src/types/media.ts`

All types derived from backend OpenAPI schemas.

- [ ] **Step 1: Create API common types**

Create `src/types/api.ts`:

```typescript
export interface PaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface ApiError {
  detail: string | ValidationErrorDetail[];
}

export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}
```

- [ ] **Step 2: Create user types**

Create `src/types/user.ts`:

```typescript
export type UserRole = "owner" | "admin" | "user" | "suspended";

export interface ProfilePhotoRead {
  id: string;
  medium_url: string;
  small_url: string;
}

export interface UserRead {
  id: string;
  email: string;
  phone: string;
  name: string;
  middle_name: string | null;
  surname: string;
  role: UserRole;
  created_at: string;
  profile_photo: ProfilePhotoRead | null;
}

export interface UserCreate {
  email: string;
  password: string;
  phone: string;
  name: string;
  surname: string;
  middle_name?: string | null;
  profile_photo_id?: string | null;
}

export interface UserUpdate {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  surname?: string | null;
  middle_name?: string | null;
  password?: string | null;
  new_password?: string | null;
  profile_photo_id?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
```

- [ ] **Step 3: Create listing types**

Create `src/types/listing.ts`:

```typescript
export type ListingStatus = "hidden" | "published" | "archived";

export interface ListingCategoryRead {
  id: string;
  name: string;
  verified: boolean;
  created_at: string;
  listing_count: number;
}

export interface MediaPhotoRead {
  id: string;
  large_url: string | null;
  medium_url: string | null;
  small_url: string | null;
  position: number;
}

export interface MediaVideoRead {
  id: string;
  full_url: string | null;
  preview_url: string | null;
  position: number;
}

export interface MediaDocumentRead {
  id: string;
  url: string;
  filename: string;
  file_size: number;
  position: number;
}

export interface ListingRead {
  id: string;
  name: string;
  category: ListingCategoryRead;
  price: number;
  description: string | null;
  specifications: Record<string, string> | null;
  status: ListingStatus;
  organization_id: string;
  added_by_id: string;
  with_operator: boolean;
  on_owner_site: boolean;
  delivery: boolean;
  installation: boolean;
  setup: boolean;
  created_at: string;
  updated_at: string;
  photos: MediaPhotoRead[];
  videos: MediaVideoRead[];
  documents: MediaDocumentRead[];
}

export interface ReservationRead {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
}

export interface ListingsQueryParams {
  cursor?: string | null;
  limit?: number;
  search?: string | null;
  category_id?: string | null;
  organization_id?: string | null;
}
```

- [ ] **Step 4: Create organization types**

Create `src/types/organization.ts`:

```typescript
export type OrganizationStatus = "created" | "verified";

export interface ContactRead {
  id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
}

export interface OrganizationRead {
  id: string;
  inn: string;
  short_name: string | null;
  full_name: string | null;
  registration_date: string | null;
  authorized_capital_k_rubles: string | null;
  legal_address: string | null;
  manager_name: string | null;
  main_activity: string | null;
  status: OrganizationStatus;
  contacts: ContactRead[];
  photo: ProfilePhotoRead | null;
}

export interface OrganizationListRead {
  id: string;
  inn: string;
  short_name: string | null;
  full_name: string | null;
  status: OrganizationStatus;
  photo: ProfilePhotoRead | null;
  published_listing_count: number;
}

// Re-export ProfilePhotoRead since orgs use it
import type { ProfilePhotoRead } from "./user";
export type { ProfilePhotoRead };
```

- [ ] **Step 5: Create order types**

Create `src/types/order.ts`:

```typescript
export type OrderStatus =
  | "pending"
  | "offered"
  | "accepted"
  | "confirmed"
  | "active"
  | "finished"
  | "canceled_by_user"
  | "canceled_by_organization"
  | "expired";

export interface OrderRead {
  id: string;
  listing_id: string;
  organization_id: string;
  requester_id: string;
  requested_start_date: string;
  requested_end_date: string;
  status: OrderStatus;
  estimated_cost: string | null;
  offered_cost: string | null;
  offered_start_date: string | null;
  offered_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderCreate {
  listing_id: string;
  requested_start_date: string;
  requested_end_date: string;
}
```

- [ ] **Step 6: Create media types**

Create `src/types/media.ts`:

```typescript
export type MediaKind = "photo" | "video" | "document";
export type MediaContext = "user_profile" | "org_profile" | "listing" | "chat";
export type MediaStatus = "pending_upload" | "processing" | "ready" | "failed";

export interface UploadUrlRequest {
  kind: MediaKind;
  context: MediaContext;
  filename: string;
  content_type: string;
  file_size: number;
}

export interface UploadUrlResponse {
  media_id: string;
  upload_url: string;
  expires_in: number;
}

export interface MediaStatusResponse {
  id: string;
  status: MediaStatus;
  kind: MediaKind;
  context: MediaContext;
  original_filename: string;
  variants: Record<string, string>;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript types from backend OpenAPI schema"
```

---

### Task 3: API Client

**Files:**
- Create: `src/lib/api/client.ts`, `src/lib/api/users.ts`, `src/lib/api/listings.ts`, `src/lib/api/organizations.ts`, `src/lib/api/orders.ts`, `src/lib/api/media.ts`, `src/lib/api/index.ts`
- Test: `src/lib/api/__tests__/client.test.ts`

- [ ] **Step 1: Write tests for the base client**

Create `src/lib/api/__tests__/client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "../client";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prepends base URL to relative paths", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    });

    await apiClient("/users/me");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/users/me"),
      expect.any(Object)
    );
  });

  it("attaches Authorization header when token provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiClient("/users/me", { token: "test-jwt" });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get("Authorization")).toBe("Bearer test-jwt");
  });

  it("throws on non-ok response with parsed error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: "Bad request" }),
    });

    await expect(apiClient("/test")).rejects.toMatchObject({
      status: 400,
      detail: "Bad request",
    });
  });

  it("builds query string from params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiClient("/listings", {
      params: { search: "excavator", limit: 10, empty: null },
    });

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("search=excavator");
    expect(url).toContain("limit=10");
    expect(url).not.toContain("empty");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/api/__tests__/client.test.ts
```

Expected: FAIL — module `../client` not found.

- [ ] **Step 3: Implement the base API client**

Create `src/lib/api/client.ts`:

```typescript
export const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.API_URL || "https://api.equip-me.ru/api/v1"
    : process.env.NEXT_PUBLIC_API_URL || "https://api.equip-me.ru/api/v1";

export class ApiRequestError extends Error {
  status: number;
  detail: string | unknown;

  constructor(status: number, detail: string | unknown) {
    super(typeof detail === "string" ? detail : "API Error");
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  params?: Record<string, string | number | boolean | null | undefined>;
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, params } = options;

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let url = `${API_BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== "") {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      const json = await response.json();
      detail = json.detail ?? json;
    } catch {
      detail = response.statusText;
    }
    throw new ApiRequestError(response.status, detail);
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/api/__tests__/client.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Create domain endpoint modules**

Create `src/lib/api/users.ts`:

```typescript
import { apiClient } from "./client";
import type { UserRead, UserCreate, UserUpdate, LoginRequest, TokenResponse } from "@/types/user";

export const usersApi = {
  register(data: UserCreate) {
    return apiClient<TokenResponse>("/users/", {
      method: "POST",
      body: data,
    });
  },

  login(data: LoginRequest) {
    return apiClient<TokenResponse>("/users/token", {
      method: "POST",
      body: data,
    });
  },

  me(token: string) {
    return apiClient<UserRead>("/users/me", { token });
  },

  update(token: string, data: UserUpdate) {
    return apiClient<UserRead>("/users/me", {
      method: "PATCH",
      body: data,
      token,
    });
  },
};
```

Create `src/lib/api/listings.ts`:

```typescript
import { apiClient } from "./client";
import type { ListingRead, ListingCategoryRead, ListingsQueryParams, ReservationRead } from "@/types/listing";
import type { PaginatedResponse } from "@/types/api";

export const listingsApi = {
  list(params?: ListingsQueryParams, token?: string | null) {
    return apiClient<PaginatedResponse<ListingRead>>("/listings/", {
      params: params as Record<string, string | number | boolean | null | undefined>,
      token,
    });
  },

  get(id: string, token?: string | null) {
    return apiClient<ListingRead>(`/listings/${id}`, { token });
  },

  categories() {
    return apiClient<ListingCategoryRead[]>("/listings/categories/");
  },

  reservations(listingId: string) {
    return apiClient<ReservationRead[]>(`/listings/${listingId}/reservations`);
  },
};
```

Create `src/lib/api/organizations.ts`:

```typescript
import { apiClient } from "./client";
import type { OrganizationRead, OrganizationListRead } from "@/types/organization";
import type { ListingCategoryRead } from "@/types/listing";
import type { PaginatedResponse } from "@/types/api";

interface OrganizationsQueryParams {
  cursor?: string | null;
  limit?: number;
  search?: string | null;
}

export const organizationsApi = {
  list(params?: OrganizationsQueryParams) {
    return apiClient<PaginatedResponse<OrganizationListRead>>("/organizations/", {
      params: params as Record<string, string | number | boolean | null | undefined>,
    });
  },

  get(id: string) {
    return apiClient<OrganizationRead>(`/organizations/${id}`);
  },

  categories(orgId: string) {
    return apiClient<ListingCategoryRead[]>(
      `/organizations/${orgId}/listings/categories/`
    );
  },
};
```

Create `src/lib/api/orders.ts`:

```typescript
import { apiClient } from "./client";
import type { OrderRead, OrderCreate } from "@/types/order";

export const ordersApi = {
  create(token: string, data: OrderCreate) {
    return apiClient<OrderRead>("/orders/", {
      method: "POST",
      body: data,
      token,
    });
  },
};
```

Create `src/lib/api/media.ts`:

```typescript
import { apiClient } from "./client";
import type { UploadUrlRequest, UploadUrlResponse, MediaStatusResponse } from "@/types/media";

export const mediaApi = {
  requestUploadUrl(token: string, data: UploadUrlRequest) {
    return apiClient<UploadUrlResponse>("/media/upload-url", {
      method: "POST",
      body: data,
      token,
    });
  },

  confirm(token: string, mediaId: string) {
    return apiClient<MediaStatusResponse>(`/media/${mediaId}/confirm`, {
      method: "POST",
      token,
    });
  },

  status(token: string, mediaId: string) {
    return apiClient<MediaStatusResponse>(`/media/${mediaId}/status`, {
      token,
    });
  },
};
```

Create `src/lib/api/index.ts`:

```typescript
export { usersApi } from "./users";
export { listingsApi } from "./listings";
export { organizationsApi } from "./organizations";
export { ordersApi } from "./orders";
export { mediaApi } from "./media";
export { apiClient, ApiRequestError } from "./client";
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/ src/types/
git commit -m "feat: add typed API client with domain endpoint modules"
```

---

### Task 4: Zod Validators

**Files:**
- Create: `src/lib/validators/auth.ts`, `src/lib/validators/listing.ts`, `src/lib/validators/order.ts`
- Test: `src/lib/validators/__tests__/auth.test.ts`

- [ ] **Step 1: Write tests for auth validators**

Create `src/lib/validators/__tests__/auth.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "../auth";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "Password1!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Password1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validData = {
    name: "Ivan",
    surname: "Petrov",
    email: "ivan@example.com",
    phone: "+79991234567",
    password: "Password1!",
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts optional middle_name", () => {
    const result = registerSchema.safeParse({
      ...validData,
      middle_name: "Sergeevich",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid Russian phone", () => {
    const result = registerSchema.safeParse({
      ...validData,
      phone: "1234567890",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "123",
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/validators/__tests__/auth.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement validators**

Create `src/lib/validators/auth.ts`:

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  middle_name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^\+7\d{10}$/, "Phone must be in format +7XXXXXXXXXX"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
```

Create `src/lib/validators/listing.ts`:

```typescript
import { z } from "zod";

export const catalogFiltersSchema = z.object({
  search: z.string().optional(),
  category_id: z.string().optional(),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().min(0).optional(),
  delivery: z.boolean().optional(),
  with_operator: z.boolean().optional(),
  on_owner_site: z.boolean().optional(),
  installation: z.boolean().optional(),
  setup: z.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
});

export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;
```

Create `src/lib/validators/order.ts`:

```typescript
import { z } from "zod";

export const orderCreateSchema = z
  .object({
    listing_id: z.string(),
    requested_start_date: z.string(),
    requested_end_date: z.string(),
  })
  .refine(
    (data) => new Date(data.requested_start_date) < new Date(data.requested_end_date),
    { message: "Start date must be before end date", path: ["requested_end_date"] }
  );

export type OrderCreateFormData = z.infer<typeof orderCreateSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/validators/__tests__/auth.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/
git commit -m "feat: add Zod validation schemas for auth, listing filters, and orders"
```

---

### Task 5: i18n Setup (next-intl)

**Files:**
- Create: `src/lib/i18n/config.ts`, `src/lib/i18n/request.ts`, `src/lib/i18n/routing.ts`, `src/lib/i18n/messages/ru.json`, `src/lib/i18n/messages/en.json`, `src/middleware.ts`
- Modify: `src/app/layout.tsx`, create `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Create i18n configuration**

Create `src/lib/i18n/config.ts`:

```typescript
export const locales = ["ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";
```

Create `src/lib/i18n/routing.ts`:

```typescript
import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
});
```

Create `src/lib/i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "ru" | "en")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 2: Create middleware for locale routing**

Create `src/middleware.ts`:

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 3: Create translation files**

Create `src/lib/i18n/messages/ru.json`:

```json
{
  "common.appName": "Equip Me",
  "common.loading": "Загрузка...",
  "common.error": "Произошла ошибка",
  "common.retry": "Повторить",
  "common.save": "Сохранить",
  "common.cancel": "Отмена",
  "common.delete": "Удалить",
  "common.search": "Поиск",
  "common.clearFilters": "Сбросить фильтры",
  "common.loadMore": "Загрузить ещё",
  "common.comingSoon": "Скоро",
  "common.notFound": "Страница не найдена",
  "common.notFoundDescription": "Запрашиваемая страница не существует",
  "common.backHome": "На главную",

  "nav.home": "Главная",
  "nav.catalog": "Каталог",
  "nav.myOrders": "Мои заказы",
  "nav.settings": "Настройки",
  "nav.createOrg": "Создать организацию",
  "nav.joinOrg": "Вступить в организацию",
  "nav.logout": "Выйти",

  "auth.login": "Войти",
  "auth.register": "Зарегистрироваться",
  "auth.email": "Email",
  "auth.password": "Пароль",
  "auth.name": "Имя",
  "auth.surname": "Фамилия",
  "auth.middleName": "Отчество",
  "auth.phone": "Телефон",
  "auth.profilePhoto": "Фото профиля",
  "auth.noAccount": "Нет аккаунта?",
  "auth.hasAccount": "Уже есть аккаунт?",
  "auth.loginError": "Неверный email или пароль",
  "auth.registerError": "Ошибка регистрации",
  "auth.emailTaken": "Email уже занят",

  "home.hero.title": "Аренда оборудования для любых задач",
  "home.hero.subtitle": "Найдите и арендуйте технику и оборудование у проверенных организаций",
  "home.hero.cta": "Смотреть каталог",
  "home.hero.searchPlaceholder": "Поиск оборудования...",
  "home.latestListings": "Новое оборудование",
  "home.topOrganizations": "Надёжные организации",
  "home.partners": "Партнёры",
  "home.ctaRent": "Есть оборудование для аренды?",
  "home.ctaRentDesc": "Создайте организацию и начните сдавать технику",
  "home.ctaSearch": "Ищете что-то конкретное?",
  "home.ctaSearchDesc": "Просмотрите каталог и найдите нужное оборудование",

  "catalog.title": "Каталог оборудования",
  "catalog.filters": "Фильтры",
  "catalog.noResults": "Ничего не найдено по вашему запросу",
  "catalog.noResultsSearch": "Ничего не найдено по запросу \"{query}\"",
  "catalog.tryDifferent": "Попробуйте другой запрос",
  "catalog.sort.newest": "Сначала новые",
  "catalog.sort.priceAsc": "Цена: по возрастанию",
  "catalog.sort.priceDesc": "Цена: по убыванию",
  "catalog.priceRange": "Цена",
  "catalog.priceMin": "от",
  "catalog.priceMax": "до",
  "catalog.services": "Услуги",
  "catalog.delivery": "Доставка",
  "catalog.withOperator": "С оператором",
  "catalog.onOwnerSite": "На площадке владельца",
  "catalog.installation": "Монтаж",
  "catalog.setup": "Настройка",
  "catalog.perDay": "руб/день",
  "catalog.categories": "Категории",

  "listing.requestRental": "Оставить заявку",
  "listing.specifications": "Характеристики",
  "listing.description": "Описание",
  "listing.selectDates": "Выберите даты аренды",
  "listing.startDate": "Дата начала",
  "listing.endDate": "Дата окончания",
  "listing.estimatedCost": "Ориентировочная стоимость",
  "listing.days": "дней",
  "listing.reserved": "Занято",
  "listing.loginToOrder": "Войдите, чтобы оставить заявку",
  "listing.orderSuccess": "Заявка успешно создана",

  "org.listings": "Оборудование",
  "org.noListings": "У этой организации пока нет оборудования",
  "org.contacts": "Контакты",
  "org.verified": "Проверена",
  "org.legalAddress": "Юридический адрес",

  "errors.networkError": "Ошибка сети",
  "errors.forbidden": "У вас нет доступа",
  "errors.serverError": "Сервис временно недоступен, попробуйте позже"
}
```

Create `src/lib/i18n/messages/en.json`:

```json
{
  "common.appName": "Equip Me",
  "common.loading": "Loading...",
  "common.error": "An error occurred",
  "common.retry": "Retry",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.search": "Search",
  "common.clearFilters": "Clear filters",
  "common.loadMore": "Load more",
  "common.comingSoon": "Coming soon",
  "common.notFound": "Page not found",
  "common.notFoundDescription": "The page you requested does not exist",
  "common.backHome": "Back to home",

  "nav.home": "Home",
  "nav.catalog": "Catalog",
  "nav.myOrders": "My Orders",
  "nav.settings": "Settings",
  "nav.createOrg": "Create organization",
  "nav.joinOrg": "Join organization",
  "nav.logout": "Log out",

  "auth.login": "Log in",
  "auth.register": "Sign up",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.name": "First name",
  "auth.surname": "Last name",
  "auth.middleName": "Middle name",
  "auth.phone": "Phone",
  "auth.profilePhoto": "Profile photo",
  "auth.noAccount": "Don't have an account?",
  "auth.hasAccount": "Already have an account?",
  "auth.loginError": "Incorrect email or password",
  "auth.registerError": "Registration error",
  "auth.emailTaken": "Email already taken",

  "home.hero.title": "Rent equipment for any project",
  "home.hero.subtitle": "Find and rent machinery and equipment from trusted organizations",
  "home.hero.cta": "Browse catalog",
  "home.hero.searchPlaceholder": "Search equipment...",
  "home.latestListings": "Latest equipment",
  "home.topOrganizations": "Trusted organizations",
  "home.partners": "Partners",
  "home.ctaRent": "Have equipment to rent?",
  "home.ctaRentDesc": "Create an organization and start renting out your machinery",
  "home.ctaSearch": "Looking for something specific?",
  "home.ctaSearchDesc": "Browse the catalog and find the equipment you need",

  "catalog.title": "Equipment catalog",
  "catalog.filters": "Filters",
  "catalog.noResults": "No listings match your filters",
  "catalog.noResultsSearch": "Nothing found for \"{query}\"",
  "catalog.tryDifferent": "Try a different search",
  "catalog.sort.newest": "Newest first",
  "catalog.sort.priceAsc": "Price: low to high",
  "catalog.sort.priceDesc": "Price: high to low",
  "catalog.priceRange": "Price",
  "catalog.priceMin": "from",
  "catalog.priceMax": "to",
  "catalog.services": "Services",
  "catalog.delivery": "Delivery",
  "catalog.withOperator": "With operator",
  "catalog.onOwnerSite": "On owner's site",
  "catalog.installation": "Installation",
  "catalog.setup": "Setup",
  "catalog.perDay": "rub/day",
  "catalog.categories": "Categories",

  "listing.requestRental": "Request rental",
  "listing.specifications": "Specifications",
  "listing.description": "Description",
  "listing.selectDates": "Select rental dates",
  "listing.startDate": "Start date",
  "listing.endDate": "End date",
  "listing.estimatedCost": "Estimated cost",
  "listing.days": "days",
  "listing.reserved": "Reserved",
  "listing.loginToOrder": "Log in to request rental",
  "listing.orderSuccess": "Order created successfully",

  "org.listings": "Equipment",
  "org.noListings": "This organization has no listings yet",
  "org.contacts": "Contacts",
  "org.verified": "Verified",
  "org.legalAddress": "Legal address",

  "errors.networkError": "Connection lost",
  "errors.forbidden": "You don't have permission",
  "errors.serverError": "Service temporarily unavailable, try again"
}
```

- [ ] **Step 4: Create root layout with locale provider**

Update `src/app/layout.tsx` to be a minimal HTML shell (fonts, metadata only — no providers, those go in `[locale]/layout.tsx`).

Create `src/app/[locale]/layout.tsx`:

```typescript
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n/routing";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "ru" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 5: Configure next.config.ts for next-intl**

Update `next.config.ts`:

```typescript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: Build succeeds. Navigating to `/ru` or `/en` should work.

- [ ] **Step 7: Commit**

```bash
git add src/lib/i18n/ src/middleware.ts src/app/ next.config.ts
git commit -m "feat: set up next-intl with ru/en locale routing and translation files"
```

---

### Task 6: Zustand Auth Store + TanStack Query Provider

**Files:**
- Create: `src/lib/stores/auth-store.ts`, `src/lib/query/client.ts`, `src/lib/query/providers.tsx`, `src/lib/hooks/use-auth.ts`
- Test: `src/lib/stores/__tests__/auth-store.test.ts`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Write tests for auth store**

Create `src/lib/stores/__tests__/auth-store.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../auth-store";

vi.mock("@/lib/api/users", () => ({
  usersApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
  },
}));

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  it("starts with no user and no token", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("sets user and token on setAuth", () => {
    const mockUser = {
      id: "1",
      email: "test@test.com",
      phone: "+79991234567",
      name: "Test",
      middle_name: null,
      surname: "User",
      role: "user" as const,
      created_at: "2026-01-01T00:00:00Z",
      profile_photo: null,
    };

    useAuthStore.getState().setAuth(mockUser, "test-token");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe("test-token");
    expect(state.isAuthenticated).toBe(true);
  });

  it("clears state on logout", () => {
    useAuthStore.getState().setAuth(
      {
        id: "1",
        email: "test@test.com",
        phone: "+79991234567",
        name: "Test",
        middle_name: null,
        surname: "User",
        role: "user",
        created_at: "2026-01-01T00:00:00Z",
        profile_photo: null,
      },
      "token"
    );

    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/stores/__tests__/auth-store.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement auth store**

Create `src/lib/stores/auth-store.ts`:

```typescript
import { create } from "zustand";
import type { UserRead } from "@/types/user";

interface AuthState {
  user: UserRead | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserRead, token: string) => void;
  clearAuth: () => void;
  setUser: (user: UserRead) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) =>
    set({ user, token, isAuthenticated: true }),

  clearAuth: () =>
    set({ user: null, token: null, isAuthenticated: false }),

  setUser: (user) => set({ user }),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/stores/__tests__/auth-store.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Create TanStack Query provider**

Create `src/lib/query/client.ts`:

```typescript
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
      },
    },
  });
}
```

Create `src/lib/query/providers.tsx`:

```typescript
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { makeQueryClient } from "./client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 6: Create useAuth hook**

Create `src/lib/hooks/use-auth.ts`:

```typescript
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usersApi } from "@/lib/api/users";
import type { LoginRequest, UserCreate } from "@/types/user";

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const login = useCallback(
    async (data: LoginRequest) => {
      const { access_token } = await usersApi.login(data);
      const me = await usersApi.me(access_token);
      setAuth(me, access_token);
      return me;
    },
    [setAuth]
  );

  const register = useCallback(
    async (data: UserCreate) => {
      const { access_token } = await usersApi.register(data);
      const me = await usersApi.me(access_token);
      setAuth(me, access_token);
      return me;
    },
    [setAuth]
  );

  const logout = useCallback(() => {
    clearAuth();
    router.push("/");
  }, [clearAuth, router]);

  const hydrate = useCallback(async () => {
    if (!token) return;
    try {
      const me = await usersApi.me(token);
      setAuth(me, token);
    } catch {
      clearAuth();
    }
  }, [token, setAuth, clearAuth]);

  return { user, token, isAuthenticated, login, register, logout, hydrate };
}
```

- [ ] **Step 7: Wire providers into locale layout**

Update `src/app/[locale]/layout.tsx` to wrap children with `QueryProvider` and `Toaster` (from sonner):

```typescript
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n/routing";
import { QueryProvider } from "@/lib/query/providers";
import { Toaster } from "sonner";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "ru" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <QueryProvider>
        {children}
        <Toaster position="top-right" />
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/lib/stores/ src/lib/query/ src/lib/hooks/ src/app/[locale]/layout.tsx
git commit -m "feat: add Zustand auth store, TanStack Query provider, and useAuth hook"
```

---

### Task 7: Public Layout (Navbar + Footer)

**Files:**
- Create: `src/components/layout/public-navbar.tsx`, `src/components/layout/user-menu.tsx`, `src/components/layout/locale-switcher.tsx`, `src/components/layout/notification-bell.tsx`, `src/components/layout/footer.tsx`, `src/app/[locale]/(public)/layout.tsx`

- [ ] **Step 1: Create LocaleSwitcher**

Create `src/components/layout/locale-switcher.tsx`:

```typescript
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => switchLocale("ru")}
        className={`px-2 py-1 rounded ${
          locale === "ru" ? "font-semibold text-black" : "text-zinc-500 hover:text-black"
        }`}
      >
        RU
      </button>
      <span className="text-zinc-300">/</span>
      <button
        onClick={() => switchLocale("en")}
        className={`px-2 py-1 rounded ${
          locale === "en" ? "font-semibold text-black" : "text-zinc-500 hover:text-black"
        }`}
      >
        EN
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create NotificationBell placeholder**

Create `src/components/layout/notification-bell.tsx`:

```typescript
"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const t = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-4 text-center text-sm text-zinc-500">
          {t("common.comingSoon")}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 3: Create UserMenu**

Create `src/components/layout/user-menu.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { User, LogOut, ShoppingBag, Settings, Building2, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";

export function UserMenu() {
  const t = useTranslations();
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = `${user.name[0]}${user.surname[0]}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.profile_photo?.small_url} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name} {user.surname}</p>
          <p className="text-xs text-zinc-500">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/orders">
            <ShoppingBag className="mr-2 h-4 w-4" />
            {t("nav.myOrders")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            {t("nav.settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/organizations/new">
            <Building2 className="mr-2 h-4 w-4" />
            {t("nav.createOrg")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="#">
            <UserPlus className="mr-2 h-4 w-4" />
            {t("nav.joinOrg")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 4: Create PublicNavbar**

Create `src/components/layout/public-navbar.tsx`:

```typescript
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { LocaleSwitcher } from "./locale-switcher";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";
import { useAuthStore } from "@/lib/stores/auth-store";

export function PublicNavbar() {
  const t = useTranslations();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black text-white text-sm font-bold">
              E
            </div>
            <span className="text-lg font-semibold tracking-tight">equip me</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="text-zinc-600 hover:text-black transition-colors">
              {t("nav.home")}
            </Link>
            <Link href="/listings" className="text-zinc-600 hover:text-black transition-colors">
              {t("nav.catalog")}
            </Link>
          </nav>
        </div>

        {/* Right: Locale + Bell + Auth */}
        <div className="hidden md:flex items-center gap-3">
          <LocaleSwitcher />
          {isAuthenticated && <NotificationBell />}
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t("auth.login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">{t("auth.register")}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-4 mt-8">
              <SheetClose asChild>
                <Link href="/" className="text-lg font-medium">{t("nav.home")}</Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/listings" className="text-lg font-medium">{t("nav.catalog")}</Link>
              </SheetClose>
              <hr className="my-2" />
              {isAuthenticated ? (
                <>
                  <SheetClose asChild>
                    <Link href="/orders">{t("nav.myOrders")}</Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/settings">{t("nav.settings")}</Link>
                  </SheetClose>
                </>
              ) : (
                <>
                  <SheetClose asChild>
                    <Link href="/login">{t("auth.login")}</Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/register">{t("auth.register")}</Link>
                  </SheetClose>
                </>
              )}
              <hr className="my-2" />
              <LocaleSwitcher />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create Footer**

Create `src/components/layout/footer.tsx`:

```typescript
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-black text-white text-xs font-bold">
            E
          </div>
          <span className="font-medium text-zinc-700">equip me</span>
        </div>
        <span>&copy; {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Create public layout**

Create `src/app/[locale]/(public)/layout.tsx`:

```typescript
import { PublicNavbar } from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 7: Create placeholder layouts for dashboard and admin**

Create `src/app/[locale]/(dashboard)/layout.tsx`:

```typescript
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

Create `src/app/[locale]/(admin)/layout.tsx`:

```typescript
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

- [ ] **Step 8: Create 404 page**

Create `src/app/[locale]/not-found.tsx`:

```typescript
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-zinc-500">{t("common.notFoundDescription")}</p>
      <Link
        href="/"
        className="text-sm font-medium underline underline-offset-4 hover:text-zinc-600"
      >
        {t("common.backHome")}
      </Link>
    </div>
  );
}
```

- [ ] **Step 9: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
git add src/components/layout/ src/app/[locale]/
git commit -m "feat: add public layout with navbar, user menu, locale switcher, and footer"
```

---

### Task 8: Shared Components

**Files:**
- Create: `src/components/shared/cursor-pagination.tsx`, `src/components/shared/empty-state.tsx`, `src/components/shared/status-badge.tsx`, `src/components/shared/confirm-dialog.tsx`

- [ ] **Step 1: Create CursorPagination**

Create `src/components/shared/cursor-pagination.tsx`:

```typescript
"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface CursorPaginationProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function CursorPagination({ hasMore, isLoading, onLoadMore }: CursorPaginationProps) {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center py-8">
      <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {useTranslations()("common.loadMore")}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create EmptyState**

Create `src/components/shared/empty-state.tsx`:

```typescript
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  message: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function EmptyState({ message, ctaLabel, onCtaClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-zinc-500">{message}</p>
      {ctaLabel && onCtaClick && (
        <Button variant="outline" className="mt-4" onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create StatusBadge and ConfirmDialog**

Create `src/components/shared/status-badge.tsx`:

```typescript
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function StatusBadge({ status, variant = "secondary", className }: StatusBadgeProps) {
  return (
    <Badge variant={variant} className={cn("text-xs", className)}>
      {status}
    </Badge>
  );
}
```

Create `src/components/shared/confirm-dialog.tsx`:

```typescript
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useTranslations();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

Note: You'll need to add the `alert-dialog` shadcn/ui component first:

```bash
npx shadcn@latest add alert-dialog
```

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/
git commit -m "feat: add shared components — pagination, empty state, status badge, confirm dialog"
```

---

### Task 9: Auth Pages (Login + Register)

**Files:**
- Create: `src/app/[locale]/(auth)/layout.tsx`, `src/app/[locale]/(auth)/login/page.tsx`, `src/app/[locale]/(auth)/register/page.tsx`, `src/components/media/avatar-upload.tsx`, `src/components/media/upload-progress.tsx`, `src/lib/hooks/use-media-upload.ts`

- [ ] **Step 1: Create media upload hook**

Create `src/lib/hooks/use-media-upload.ts`:

```typescript
"use client";

import { useState, useCallback } from "react";
import { mediaApi } from "@/lib/api/media";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { MediaKind, MediaContext, MediaStatusResponse } from "@/types/media";

type UploadState = "idle" | "uploading" | "processing" | "ready" | "failed";

export function useMediaUpload() {
  const token = useAuthStore((s) => s.token);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [media, setMedia] = useState<MediaStatusResponse | null>(null);

  const upload = useCallback(
    async (file: File, kind: MediaKind, context: MediaContext) => {
      if (!token) throw new Error("Not authenticated");

      setState("uploading");
      setProgress(0);

      // Step 1: Get presigned URL
      const { media_id, upload_url } = await mediaApi.requestUploadUrl(token, {
        kind,
        context,
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
      });

      // Step 2: Upload to presigned URL
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Step 3: Confirm upload
      setState("processing");
      await mediaApi.confirm(token, media_id);

      // Step 4: Poll for status
      let status: MediaStatusResponse;
      while (true) {
        status = await mediaApi.status(token, media_id);
        if (status.status === "ready") {
          setState("ready");
          setMedia(status);
          return status;
        }
        if (status.status === "failed") {
          setState("failed");
          throw new Error("Media processing failed");
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    },
    [token]
  );

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setMedia(null);
  }, []);

  return { state, progress, media, upload, reset };
}
```

- [ ] **Step 2: Create AvatarUpload component**

Create `src/components/media/upload-progress.tsx`:

```typescript
"use client";

import { Loader2 } from "lucide-react";

interface UploadProgressProps {
  progress: number;
  isProcessing: boolean;
}

export function UploadProgress({ progress, isProcessing }: UploadProgressProps) {
  return (
    <div className="w-full">
      {isProcessing ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        <div className="h-2 w-full rounded-full bg-zinc-100">
          <div
            className="h-2 rounded-full bg-black transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

Create `src/components/media/avatar-upload.tsx`:

```typescript
"use client";

import { useCallback, useRef } from "react";
import { Camera, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UploadProgress } from "./upload-progress";
import { useMediaUpload } from "@/lib/hooks/use-media-upload";

interface AvatarUploadProps {
  onUploaded: (mediaId: string, url: string) => void;
  currentUrl?: string | null;
}

export function AvatarUpload({ onUploaded, currentUrl }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, progress, media, upload, reset } = useMediaUpload();

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const result = await upload(file, "photo", "user_profile");
        const url = result.variants.medium || result.variants.small || "";
        onUploaded(result.id, url);
      } catch {
        // Error state handled by hook
      }
    },
    [upload, onUploaded]
  );

  const previewUrl =
    media?.variants.medium || media?.variants.small || currentUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Avatar className="h-20 w-20">
          <AvatarImage src={previewUrl || undefined} />
          <AvatarFallback>
            <Camera className="h-6 w-6 text-zinc-400" />
          </AvatarFallback>
        </Avatar>
        {state === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 hover:bg-black/10 transition-colors">
            <Camera className="h-5 w-5 text-transparent hover:text-white" />
          </div>
        )}
      </div>

      {(state === "uploading" || state === "processing") && (
        <UploadProgress progress={progress} isProcessing={state === "processing"} />
      )}

      {state === "failed" && (
        <Button variant="outline" size="sm" onClick={reset}>
          Retry
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create auth layout**

Create `src/app/[locale]/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white font-bold">
              E
            </div>
            <span className="text-xl font-semibold tracking-tight">equip me</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create login page**

Create `src/app/[locale]/(auth)/login/page.tsx`:

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { loginSchema, type LoginFormData } from "@/lib/validators/auth";
import { ApiRequestError } from "@/lib/api/client";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data);
      const returnTo = searchParams.get("returnTo") || "/";
      router.push(returnTo);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setError(t("auth.loginError"));
      } else {
        setError(t("common.error"));
      }
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("auth.login")}
          </Button>
          <p className="text-sm text-zinc-500">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="font-medium text-black underline underline-offset-4">
              {t("auth.register")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 5: Create register page**

Create `src/app/[locale]/(auth)/register/page.tsx`:

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AvatarUpload } from "@/components/media/avatar-upload";
import { useAuth } from "@/lib/hooks/use-auth";
import { registerSchema, type RegisterFormData } from "@/lib/validators/auth";
import { ApiRequestError } from "@/lib/api/client";

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [profilePhotoId, setProfilePhotoId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFieldError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onPhotoUploaded = useCallback((mediaId: string) => {
    setProfilePhotoId(mediaId);
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      await registerUser({
        ...data,
        middle_name: data.middle_name || null,
        profile_photo_id: profilePhotoId,
      });
      router.push("/");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 409) {
          setFieldError("email", { message: t("auth.emailTaken") });
        } else {
          setError(t("auth.registerError"));
        }
      } else {
        setError(t("common.error"));
      }
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex justify-center">
            <AvatarUpload onUploaded={onPhotoUploaded} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">{t("auth.surname")}</Label>
              <Input id="surname" {...register("surname")} />
              {errors.surname && (
                <p className="text-xs text-red-500">{errors.surname.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="middle_name">{t("auth.middleName")}</Label>
            <Input id="middle_name" {...register("middle_name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("auth.phone")}</Label>
            <Input id="phone" type="tel" placeholder="+7" {...register("phone")} />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("auth.register")}
          </Button>
          <p className="text-sm text-zinc-500">
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="font-medium text-black underline underline-offset-4">
              {t("auth.login")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: Build succeeds. Login and register pages render at `/ru/login` and `/ru/register`.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/(auth)/ src/components/media/ src/lib/hooks/use-media-upload.ts
git commit -m "feat: add auth pages (login, register) with avatar upload and form validation"
```

---

### Task 10: Home Page

**Files:**
- Create: `src/app/[locale]/(public)/page.tsx`

This page uses `ListingCard` and `OrgCard` — we'll create lightweight inline versions here, then extract them in the catalog task.

- [ ] **Step 1: Create home page**

Create `src/app/[locale]/(public)/page.tsx`:

```typescript
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listingsApi } from "@/lib/api/listings";
import { organizationsApi } from "@/lib/api/organizations";
import type { ListingRead } from "@/types/listing";
import type { OrganizationListRead } from "@/types/organization";

export default async function HomePage() {
  const t = await getTranslations();

  let listings: ListingRead[] = [];
  let organizations: OrganizationListRead[] = [];

  try {
    const [listingsRes, orgsRes] = await Promise.all([
      listingsApi.list({ limit: 10 }),
      organizationsApi.list({ limit: 6 }),
    ]);
    listings = listingsRes.items;
    organizations = orgsRes.items;
  } catch {
    // Render page with empty data — better than error page
  }

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("home.hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500">
            {t("home.hero.subtitle")}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/listings">{t("home.hero.cta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      {listings.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("home.latestListings")}
            </h2>
            <Link
              href="/listings"
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-black"
            >
              {t("nav.catalog")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.slice(0, 8).map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] bg-zinc-100">
                    {listing.photos[0]?.medium_url && (
                      <img
                        src={listing.photos[0].medium_url}
                        alt={listing.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <span className="text-xs text-zinc-500">{listing.category.name}</span>
                    <h3 className="mt-1 font-medium text-sm line-clamp-1">{listing.name}</h3>
                    <p className="mt-1 font-bold text-sm">
                      {listing.price.toLocaleString()} {t("catalog.perDay")}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top Organizations */}
      {organizations.length > 0 && (
        <section className="border-t bg-zinc-50">
          <div className="mx-auto max-w-7xl px-4 py-16">
            <h2 className="text-2xl font-bold tracking-tight mb-8">
              {t("home.topOrganizations")}
            </h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {organizations.map((org) => (
                <Link key={org.id} href={`/organizations/${org.id}`}>
                  <div className="flex flex-col items-center gap-3 rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-400">
                      {org.photo?.small_url ? (
                        <img
                          src={org.photo.small_url}
                          alt={org.short_name || ""}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        (org.short_name || "O")[0]
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium line-clamp-1">{org.short_name || org.full_name}</p>
                      <p className="text-xs text-zinc-500">{org.published_listing_count} listings</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partners */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">
          {t("home.partners")}
        </h2>
        <div className="flex items-center justify-center gap-12 opacity-40 grayscale">
          {/* Placeholder partner logos — replace with real assets */}
          {["Partner 1", "Partner 2", "Partner 3", "Partner 4"].map((name) => (
            <div
              key={name}
              className="flex h-12 w-24 items-center justify-center rounded border text-xs text-zinc-400"
            >
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banners */}
      <section className="border-t bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-bold">{t("home.ctaRent")}</h3>
              <p className="mt-2 text-sm text-zinc-500">{t("home.ctaRentDesc")}</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/organizations/new">{t("nav.createOrg")}</Link>
              </Button>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-bold">{t("home.ctaSearch")}</h3>
              <p className="mt-2 text-sm text-zinc-500">{t("home.ctaSearchDesc")}</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/listings">{t("nav.catalog")}</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify build and test against real API**

```bash
npm run build && npm run start
```

Navigate to `http://localhost:3000/ru` — should show the home page with real data from `https://api.equip-me.ru`.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(public)/page.tsx
git commit -m "feat: add home page with hero, listings carousel, top orgs, partners, and CTAs"
```

---

### Task 11: ListingCard with Hover Photo Scrubbing

**Files:**
- Create: `src/components/catalog/listing-card.tsx`

- [ ] **Step 1: Create ListingCard with hover scrubbing**

Create `src/components/catalog/listing-card.tsx`:

```typescript
"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { ListingRead } from "@/types/listing";

interface ListingCardProps {
  listing: ListingRead;
}

export function ListingCard({ listing }: ListingCardProps) {
  const t = useTranslations();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const photos = listing.photos.sort((a, b) => a.position - b.position);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (photos.length <= 1 || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const index = Math.min(
        Math.floor(ratio * photos.length),
        photos.length - 1
      );
      setActivePhotoIndex(index);
    },
    [photos.length]
  );

  const handleMouseLeave = useCallback(() => {
    setActivePhotoIndex(0);
  }, []);

  const activePhoto = photos[activePhotoIndex];

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow group">
        <div
          ref={containerRef}
          className="relative aspect-[4/3] bg-zinc-100"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {activePhoto?.medium_url ? (
            <img
              src={activePhoto.medium_url}
              alt={listing.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-300">
              No photo
            </div>
          )}

          {/* Dot indicators */}
          {photos.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === activePhotoIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <span className="text-xs text-zinc-500">{listing.category.name}</span>
          <h3 className="mt-1 text-sm font-medium line-clamp-1">{listing.name}</h3>
          <p className="mt-1 text-sm font-bold">
            {listing.price.toLocaleString()} {t("catalog.perDay")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/catalog/listing-card.tsx
git commit -m "feat: add ListingCard with hover photo scrubbing"
```

---

### Task 12: Catalog Page (Filters + Grid + Pagination)

**Files:**
- Create: `src/components/catalog/listing-grid.tsx`, `src/components/catalog/catalog-filters.tsx`, `src/components/catalog/search-bar.tsx`, `src/app/[locale]/(public)/listings/page.tsx`

- [ ] **Step 1: Create SearchBar**

Create `src/components/catalog/search-bar.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const t = useTranslations();
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 300);
    return () => clearTimeout(timer);
  }, [local, value, onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder || t("common.search")}
        className="pl-9"
      />
    </div>
  );
}
```

- [ ] **Step 2: Create CatalogFilters**

Create `src/components/catalog/catalog-filters.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ListingCategoryRead } from "@/types/listing";
import type { CatalogFilters as CatalogFiltersType } from "@/lib/validators/listing";

interface CatalogFiltersProps {
  filters: CatalogFiltersType;
  categories: ListingCategoryRead[];
  onChange: (filters: Partial<CatalogFiltersType>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const SERVICE_FLAGS = [
  { key: "delivery", label: "catalog.delivery" },
  { key: "with_operator", label: "catalog.withOperator" },
  { key: "on_owner_site", label: "catalog.onOwnerSite" },
  { key: "installation", label: "catalog.installation" },
  { key: "setup", label: "catalog.setup" },
] as const;

export function CatalogFilters({
  filters,
  categories,
  onChange,
  onClear,
  hasActiveFilters,
}: CatalogFiltersProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <Label className="text-sm font-medium">{t("catalog.categories")}</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = filters.category_id === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() =>
                  onChange({ category_id: isActive ? undefined : cat.id })
                }
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? "border-black bg-black text-white"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium">{t("catalog.priceRange")}</Label>
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="number"
            placeholder={t("catalog.priceMin")}
            value={filters.price_min ?? ""}
            onChange={(e) =>
              onChange({ price_min: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-24"
          />
          <span className="text-zinc-400">—</span>
          <Input
            type="number"
            placeholder={t("catalog.priceMax")}
            value={filters.price_max ?? ""}
            onChange={(e) =>
              onChange({ price_max: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-24"
          />
        </div>
      </div>

      {/* Service Flags */}
      <div>
        <Label className="text-sm font-medium">{t("catalog.services")}</Label>
        <div className="mt-2 space-y-2">
          {SERVICE_FLAGS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={!!filters[key]}
                onCheckedChange={(checked) =>
                  onChange({ [key]: checked ? true : undefined })
                }
              />
              <label htmlFor={key} className="text-sm">
                {t(label)}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <Select
          value={filters.sort || "newest"}
          onValueChange={(value) =>
            onChange({ sort: value as CatalogFiltersType["sort"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("catalog.sort.newest")}</SelectItem>
            <SelectItem value="price_asc">{t("catalog.sort.priceAsc")}</SelectItem>
            <SelectItem value="price_desc">{t("catalog.sort.priceDesc")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="w-full">
          <X className="mr-2 h-4 w-4" />
          {t("common.clearFilters")}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create ListingGrid**

Create `src/components/catalog/listing-grid.tsx`:

```typescript
import { ListingCard } from "./listing-card";
import type { ListingRead } from "@/types/listing";

interface ListingGridProps {
  listings: ListingRead[];
}

export function ListingGrid({ listings }: ListingGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create Catalog page**

Create `src/app/[locale]/(public)/listings/page.tsx`:

```typescript
"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/catalog/search-bar";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { ListingGrid } from "@/components/catalog/listing-grid";
import { CursorPagination } from "@/components/shared/cursor-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { listingsApi } from "@/lib/api/listings";
import type { CatalogFilters as CatalogFiltersType } from "@/lib/validators/listing";

export default function CatalogPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: CatalogFiltersType = useMemo(
    () => ({
      search: searchParams.get("search") || undefined,
      category_id: searchParams.get("category") || undefined,
      price_min: searchParams.get("price_min")
        ? Number(searchParams.get("price_min"))
        : undefined,
      price_max: searchParams.get("price_max")
        ? Number(searchParams.get("price_max"))
        : undefined,
      delivery: searchParams.get("delivery") === "true" || undefined,
      with_operator: searchParams.get("with_operator") === "true" || undefined,
      on_owner_site: searchParams.get("on_owner_site") === "true" || undefined,
      installation: searchParams.get("installation") === "true" || undefined,
      setup: searchParams.get("setup") === "true" || undefined,
      sort: (searchParams.get("sort") as CatalogFiltersType["sort"]) || undefined,
    }),
    [searchParams]
  );

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  const updateFilters = useCallback(
    (updates: Partial<CatalogFiltersType>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === false) {
          params.delete(key === "category_id" ? "category" : key);
        } else {
          params.set(key === "category_id" ? "category" : key, String(value));
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const { data: categories = [] } = useQuery({
    queryKey: ["listing-categories"],
    queryFn: () => listingsApi.categories(),
    staleTime: 60_000,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["listings", filters],
    queryFn: ({ pageParam }) =>
      listingsApi.list({
        cursor: pageParam || undefined,
        limit: 20,
        search: filters.search,
        category_id: filters.category_id,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    staleTime: 30_000,
  });

  const listings = data?.pages.flatMap((p) => p.items) ?? [];

  const filtersPanel = (
    <CatalogFilters
      filters={filters}
      categories={categories}
      onChange={updateFilters}
      onClear={clearFilters}
      hasActiveFilters={hasActiveFilters}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6">{t("catalog.title")}</h1>

      {/* Search + Mobile filter trigger */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1">
          <SearchBar
            value={filters.search || ""}
            onChange={(search) => updateFilters({ search: search || undefined })}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <div className="py-4">{filtersPanel}</div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-64 shrink-0">{filtersPanel}</aside>

        {/* Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              message={
                filters.search
                  ? t("catalog.noResultsSearch", { query: filters.search })
                  : t("catalog.noResults")
              }
              ctaLabel={hasActiveFilters ? t("common.clearFilters") : undefined}
              onCtaClick={hasActiveFilters ? clearFilters : undefined}
            />
          ) : (
            <>
              <ListingGrid listings={listings} />
              <CursorPagination
                hasMore={!!hasNextPage}
                isLoading={isFetchingNextPage}
                onLoadMore={() => fetchNextPage()}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: Build succeeds. Catalog page at `/ru/listings` shows real listings with working filters.

- [ ] **Step 6: Commit**

```bash
git add src/components/catalog/ src/app/[locale]/(public)/listings/
git commit -m "feat: add catalog page with filters, listing grid, search, and cursor pagination"
```

---

### Task 13: Listing Detail Page

**Files:**
- Create: `src/components/catalog/media-carousel.tsx`, `src/components/catalog/listing-specs.tsx`, `src/components/catalog/listing-description.tsx`, `src/components/catalog/reservation-calendar.tsx`, `src/components/catalog/order-form.tsx`, `src/app/[locale]/(public)/listings/[id]/page.tsx`

- [ ] **Step 1: Create MediaCarousel**

Create `src/components/catalog/media-carousel.tsx`:

```typescript
"use client";

import { useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MediaPhotoRead, MediaVideoRead } from "@/types/listing";

interface MediaCarouselProps {
  photos: MediaPhotoRead[];
  videos: MediaVideoRead[];
}

type MediaItem =
  | { type: "photo"; url: string; id: string }
  | { type: "video"; url: string; preview?: string; id: string };

export function MediaCarousel({ photos, videos }: MediaCarouselProps) {
  const items: MediaItem[] = [
    ...photos
      .sort((a, b) => a.position - b.position)
      .filter((p) => p.large_url || p.medium_url)
      .map((p) => ({
        type: "photo" as const,
        url: (p.large_url || p.medium_url)!,
        id: p.id,
      })),
    ...videos
      .sort((a, b) => a.position - b.position)
      .filter((v) => v.full_url)
      .map((v) => ({
        type: "video" as const,
        url: v.full_url!,
        preview: v.preview_url || undefined,
        id: v.id,
      })),
  ];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
    setSelectedIndex(emblaApi?.selectedScrollSnap() ?? 0);
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
    setSelectedIndex(emblaApi?.selectedScrollSnap() ?? 0);
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
      setSelectedIndex(index);
    },
    [emblaApi]
  );

  if (items.length === 0) {
    return (
      <div className="aspect-[4/3] rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400">
        No media
      </div>
    );
  }

  return (
    <div>
      {/* Main carousel */}
      <div className="relative overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {items.map((item) => (
            <div key={item.id} className="flex-[0_0_100%] min-w-0">
              {item.type === "photo" ? (
                <img
                  src={item.url}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <video
                  src={item.url}
                  poster={item.preview}
                  controls
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {items.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={scrollNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => scrollTo(i)}
              className={`h-16 w-16 flex-shrink-0 rounded overflow-hidden border-2 transition-colors ${
                i === selectedIndex ? "border-black" : "border-transparent"
              }`}
            >
              <img
                src={
                  item.type === "photo" ? item.url : item.preview || item.url
                }
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create ListingSpecs and ListingDescription**

Create `src/components/catalog/listing-specs.tsx`:

```typescript
import { useTranslations } from "next-intl";

interface ListingSpecsProps {
  specifications: Record<string, string> | null;
}

export function ListingSpecs({ specifications }: ListingSpecsProps) {
  const t = useTranslations();

  if (!specifications || Object.keys(specifications).length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">{t("listing.specifications")}</h2>
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(specifications).map(([key, value]) => (
            <tr key={key} className="border-b last:border-0">
              <td className="py-2 pr-4 text-zinc-500">{key}</td>
              <td className="py-2 font-medium">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Create `src/components/catalog/listing-description.tsx`:

```typescript
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { useTranslations } from "next-intl";

interface ListingDescriptionProps {
  description: string | null;
}

export function ListingDescription({ description }: ListingDescriptionProps) {
  const t = useTranslations();

  if (!description) return null;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">{t("listing.description")}</h2>
      <div className="prose prose-sm prose-zinc max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
          {description}
        </ReactMarkdown>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ReservationCalendar**

Create `src/components/catalog/reservation-calendar.tsx`:

```typescript
"use client";

import { useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { isWithinInterval, parseISO, isBefore, startOfDay } from "date-fns";
import type { ReservationRead } from "@/types/listing";
import type { DateRange } from "react-day-picker";

interface ReservationCalendarProps {
  reservations: ReservationRead[];
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
}

export function ReservationCalendar({
  reservations,
  selected,
  onSelect,
}: ReservationCalendarProps) {
  const reservedDates = useMemo(() => {
    return reservations.map((r) => ({
      from: parseISO(r.start_date),
      to: parseISO(r.end_date),
    }));
  }, [reservations]);

  const isDateReserved = (date: Date) => {
    return reservedDates.some((range) =>
      isWithinInterval(date, { start: range.from, end: range.to })
    );
  };

  const isDateDisabled = (date: Date) => {
    return (
      isBefore(date, startOfDay(new Date())) || isDateReserved(date)
    );
  };

  return (
    <Calendar
      mode="range"
      selected={selected}
      onSelect={onSelect}
      disabled={isDateDisabled}
      modifiers={{ reserved: (date) => isDateReserved(date) }}
      modifiersClassNames={{ reserved: "bg-zinc-200 text-zinc-400" }}
      numberOfMonths={2}
      className="rounded-md border"
    />
  );
}
```

- [ ] **Step 4: Create OrderForm**

Create `src/components/catalog/order-form.tsx`:

```typescript
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ReservationCalendar } from "./reservation-calendar";
import { useAuthStore } from "@/lib/stores/auth-store";
import { listingsApi } from "@/lib/api/listings";
import { ordersApi } from "@/lib/api/orders";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";

interface OrderFormProps {
  listingId: string;
  pricePerDay: number;
}

export function OrderForm({ listingId, pricePerDay }: OrderFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations", listingId],
    queryFn: () => listingsApi.reservations(listingId),
    staleTime: 60_000,
  });

  const days = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return differenceInDays(dateRange.to, dateRange.from);
  }, [dateRange]);

  const estimatedCost = days * pricePerDay;

  const createOrder = useMutation({
    mutationFn: () => {
      if (!token || !dateRange?.from || !dateRange?.to) {
        throw new Error("Missing data");
      }
      return ordersApi.create(token, {
        listing_id: listingId,
        requested_start_date: format(dateRange.from, "yyyy-MM-dd"),
        requested_end_date: format(dateRange.to, "yyyy-MM-dd"),
      });
    },
    onSuccess: () => {
      toast.success(t("listing.orderSuccess"));
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const handleSubmit = () => {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    createOrder.mutate();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold">{t("listing.selectDates")}</h3>

      <ReservationCalendar
        reservations={reservations}
        selected={dateRange}
        onSelect={setDateRange}
      />

      {days > 0 && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm text-zinc-500">
            {t("listing.estimatedCost")} ({days} {t("listing.days")})
          </span>
          <span className="font-bold">
            {estimatedCost.toLocaleString()} {t("catalog.perDay").replace("/день", "").replace("/day", "")} rub
          </span>
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={!dateRange?.from || !dateRange?.to || createOrder.isPending}
      >
        {createOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isAuthenticated ? t("listing.requestRental") : t("listing.loginToOrder")}
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Create Listing Detail page**

Create `src/app/[locale]/(public)/listings/[id]/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Truck, User, MapPin, Wrench, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MediaCarousel } from "@/components/catalog/media-carousel";
import { ListingDescription } from "@/components/catalog/listing-description";
import { ListingSpecs } from "@/components/catalog/listing-specs";
import { OrderForm } from "@/components/catalog/order-form";
import { listingsApi } from "@/lib/api/listings";
import { organizationsApi } from "@/lib/api/organizations";

const SERVICE_FLAG_CONFIG = [
  { key: "delivery", icon: Truck, label: "catalog.delivery" },
  { key: "with_operator", icon: User, label: "catalog.withOperator" },
  { key: "on_owner_site", icon: MapPin, label: "catalog.onOwnerSite" },
  { key: "installation", icon: Wrench, label: "catalog.installation" },
  { key: "setup", icon: Settings, label: "catalog.setup" },
] as const;

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();

  let listing;
  try {
    listing = await listingsApi.get(id);
  } catch {
    notFound();
  }

  let org;
  try {
    org = await organizationsApi.get(listing.organization_id);
  } catch {
    // Org info is optional — don't fail the page
  }

  const enabledFlags = SERVICE_FLAG_CONFIG.filter(
    (f) => listing[f.key as keyof typeof listing]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left column */}
        <div className="flex-1 space-y-8">
          <MediaCarousel photos={listing.photos} videos={listing.videos} />
          <ListingDescription description={listing.description} />
          <ListingSpecs specifications={listing.specifications} />
        </div>

        {/* Right column (sticky on desktop) */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Price */}
            <div>
              <span className="text-xs text-zinc-500">{listing.category.name}</span>
              <h1 className="text-2xl font-bold">{listing.name}</h1>
              <p className="mt-2 text-xl font-bold">
                {listing.price.toLocaleString()} {t("catalog.perDay")}
              </p>
            </div>

            {/* Service flags */}
            {enabledFlags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {enabledFlags.map(({ key, icon: Icon, label }) => (
                  <Badge key={key} variant="secondary" className="gap-1">
                    <Icon className="h-3 w-3" />
                    {t(label)}
                  </Badge>
                ))}
              </div>
            )}

            {/* Order form with calendar */}
            <OrderForm listingId={listing.id} pricePerDay={listing.price} />

            {/* Org info card */}
            {org && (
              <Link
                href={`/organizations/${org.id}`}
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-400">
                  {org.photo?.small_url ? (
                    <img
                      src={org.photo.small_url}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    (org.short_name || "O")[0]
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {org.short_name || org.full_name}
                  </p>
                  {org.status === "verified" && (
                    <span className="text-xs text-zinc-500">{t("org.verified")}</span>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: Build succeeds. Listing detail page renders with carousel, specs, calendar, and order form.

- [ ] **Step 7: Commit**

```bash
git add src/components/catalog/ src/app/[locale]/(public)/listings/
git commit -m "feat: add listing detail page with media carousel, reservation calendar, and order form"
```

---

### Task 14: Organization Public Profile

**Files:**
- Create: `src/app/[locale]/(public)/organizations/[id]/page.tsx`

- [ ] **Step 1: Create org profile page**

Create `src/app/[locale]/(public)/organizations/[id]/page.tsx`:

```typescript
"use client";

import { useParams } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CheckCircle, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingGrid } from "@/components/catalog/listing-grid";
import { CursorPagination } from "@/components/shared/cursor-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { organizationsApi } from "@/lib/api/organizations";
import { listingsApi } from "@/lib/api/listings";
import type { ListingCategoryRead } from "@/types/listing";
import { useState } from "react";

export default function OrgProfilePage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: () => organizationsApi.get(id),
    staleTime: 60_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["org-categories", id],
    queryFn: () => organizationsApi.categories(id),
    staleTime: 60_000,
  });

  const {
    data: listingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: listingsLoading,
  } = useInfiniteQuery({
    queryKey: ["listings", { organization_id: id, category_id: selectedCategory }],
    queryFn: ({ pageParam }) =>
      listingsApi.list({
        cursor: pageParam || undefined,
        limit: 20,
        organization_id: id,
        category_id: selectedCategory,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    staleTime: 30_000,
  });

  const listings = listingsData?.pages.flatMap((p) => p.items) ?? [];

  if (orgLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-2xl font-bold text-zinc-400">
          {org.photo?.medium_url ? (
            <img
              src={org.photo.medium_url}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            (org.short_name || "O")[0]
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{org.short_name || org.full_name}</h1>
            {org.status === "verified" && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {t("org.verified")}
              </Badge>
            )}
          </div>
          {org.legal_address && (
            <p className="mt-1 text-sm text-zinc-500">{org.legal_address}</p>
          )}
        </div>
      </div>

      {/* Contacts */}
      {org.contacts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">{t("org.contacts")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {org.contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border p-3">
                <p className="font-medium text-sm">{contact.display_name}</p>
                {contact.phone && (
                  <p className="flex items-center gap-1 text-sm text-zinc-500 mt-1">
                    <Phone className="h-3 w-3" /> {contact.phone}
                  </p>
                )}
                {contact.email && (
                  <p className="flex items-center gap-1 text-sm text-zinc-500 mt-1">
                    <Mail className="h-3 w-3" /> {contact.email}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              !selectedCategory
                ? "border-black bg-black text-white"
                : "border-zinc-200 hover:border-zinc-400"
            }`}
          >
            All
          </button>
          {categories.map((cat: ListingCategoryRead) => (
            <button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? undefined : cat.id
                )
              }
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedCategory === cat.id
                  ? "border-black bg-black text-white"
                  : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Listings */}
      <h2 className="text-lg font-bold mb-4">{t("org.listings")}</h2>
      {listingsLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState message={t("org.noListings")} />
      ) : (
        <>
          <ListingGrid listings={listings} />
          <CursorPagination
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds. Org profile page renders at `/ru/organizations/{id}`.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(public)/organizations/
git commit -m "feat: add organization public profile page with contacts and listings grid"
```

---

### Task 15: Final Integration & Smoke Test

**Files:**
- Modify: `src/app/[locale]/(public)/page.tsx` (update to use extracted `ListingCard`)

- [ ] **Step 1: Update home page to use ListingCard component**

Replace the inline listing card on the home page with the extracted `ListingCard` from `src/components/catalog/listing-card.tsx`. Import and use `<ListingCard listing={listing} />` in the listings carousel section instead of the inline `<Card>` markup.

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass (client tests, validator tests, store tests).

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors or type errors.

- [ ] **Step 4: Manual smoke test against live backend**

```bash
npm run start
```

Test these routes against `https://api.equip-me.ru`:
- `/ru` — home page loads with real listings and orgs
- `/en` — locale switch works
- `/ru/listings` — catalog loads, filters work, pagination works
- `/ru/listings/{id}` — listing detail loads with carousel, calendar, org card
- `/ru/organizations/{id}` — org profile loads with contacts and listings
- `/ru/login` — login form renders
- `/ru/register` — register form renders with avatar upload

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: final integration — wire up ListingCard across home and catalog pages"
```

- [ ] **Step 6: Add .gitignore entry for superpowers brainstorm files**

Add to `.gitignore`:

```
.superpowers/
```

```bash
git add .gitignore
git commit -m "chore: add .superpowers to .gitignore"
```
