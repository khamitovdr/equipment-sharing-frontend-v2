# Slice D: Org Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the organization management dashboard — org creation, sidebar layout, listings CRUD with photo upload, member management, and org settings.

**Architecture:** New `(dashboard)` layout with persistent sidebar + org context in Zustand. Org-scoped API calls use the active org ID from store. Reuses existing auth patterns, media upload flow, and UI primitives.

**Tech Stack:** Next.js 16 App Router, React 19, Zustand 5, TanStack Query 5, react-hook-form 7 + Zod 4, @dnd-kit for photo reordering, Dadata API (proxied), shadcn/ui components, next-intl.

**Spec:** `docs/superpowers/specs/2026-04-07-slice-d-org-dashboard-design.md`

---

### Task 1: Types & API Layer

**Files:**
- Modify: `src/types/organization.ts`
- Create: `src/types/dadata.ts`
- Modify: `src/types/listing.ts`
- Modify: `src/lib/api/organizations.ts`
- Modify: `src/lib/api/listings.ts`
- Modify: `src/lib/api/users.ts`
- Test: `src/lib/api/__tests__/organizations.test.ts`

- [ ] **Step 1: Extend organization types**

Add to `src/types/organization.ts`:

```typescript
export type MembershipRole = "admin" | "editor" | "viewer";
export type MembershipStatus = "candidate" | "invited" | "member";

export interface MembershipRead {
  id: string;
  user_id: string;
  organization_id: string;
  role: MembershipRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  display_name: string;
  phone?: string | null;
  email?: string | null;
}

export interface OrganizationCreate {
  inn: string;
  contacts: ContactCreate[];
}

export interface OrganizationPhotoUpdate {
  photo_id: string | null;
}

export interface ContactsReplace {
  contacts: ContactCreate[];
}

export interface MembershipInvite {
  user_id: string;
  role: MembershipRole;
}

export interface MembershipApprove {
  role: MembershipRole;
}

export interface MembershipRoleUpdate {
  role: MembershipRole;
}
```

- [ ] **Step 2: Create Dadata types**

Create `src/types/dadata.ts`:

```typescript
export interface DadataSuggestion {
  value: string;
  data: {
    inn: string;
    name: {
      full_with_opf: string;
      short_with_opf: string;
    };
    address: {
      value: string;
    };
    management?: {
      name: string;
    };
    state?: {
      registration_date?: number;
    };
  };
}

export interface DadataSuggestResponse {
  suggestions: DadataSuggestion[];
}
```

- [ ] **Step 3: Extend listing types**

Add to `src/types/listing.ts`:

```typescript
export interface ListingCreate {
  name: string;
  category_id: string;
  price: number;
  description?: string;
  specifications?: Record<string, string>;
  with_operator?: boolean;
  on_owner_site?: boolean;
  delivery?: boolean;
  installation?: boolean;
  setup?: boolean;
  photo_ids?: string[];
}

export type ListingUpdate = Partial<ListingCreate>;

export interface ListingStatusUpdate {
  status: ListingStatus;
}

export interface ListingCategoryCreate {
  name: string;
}

export interface OrgListingsQueryParams {
  cursor?: string | null;
  limit?: number;
  search?: string | null;
  status?: ListingStatus | null;
  category_id?: string | null;
}
```

- [ ] **Step 4: Extend organizations API**

Replace `src/lib/api/organizations.ts` with the existing methods plus new ones:

```typescript
import { apiClient } from "./client";
import type {
  OrganizationRead,
  OrganizationListRead,
  OrganizationCreate,
  OrganizationPhotoUpdate,
  ContactsReplace,
  MembershipRead,
  MembershipInvite,
  MembershipApprove,
  MembershipRoleUpdate,
} from "@/types/organization";
import type { ListingCategoryRead } from "@/types/listing";
import type { PaginatedResponse } from "@/types/api";

interface OrganizationsQueryParams {
  cursor?: string | null;
  limit?: number;
  search?: string | null;
}

export const organizationsApi = {
  // Existing
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

  // New — org CRUD
  create(token: string, data: OrganizationCreate) {
    return apiClient<OrganizationRead>("/organizations/", {
      method: "POST",
      body: data,
      token,
    });
  },

  updatePhoto(token: string, orgId: string, data: OrganizationPhotoUpdate) {
    return apiClient<OrganizationRead>(`/organizations/${orgId}/photo`, {
      method: "PATCH",
      body: data,
      token,
    });
  },

  replaceContacts(token: string, orgId: string, data: ContactsReplace) {
    return apiClient<OrganizationRead>(`/organizations/${orgId}/contacts`, {
      method: "PUT",
      body: data,
      token,
    });
  },

  // New — members
  listMembers(token: string, orgId: string, params?: { cursor?: string | null; limit?: number }) {
    return apiClient<PaginatedResponse<MembershipRead>>(
      `/organizations/${orgId}/members`,
      {
        token,
        params: params as Record<string, string | number | boolean | null | undefined>,
      }
    );
  },

  inviteMember(token: string, orgId: string, data: MembershipInvite) {
    return apiClient<MembershipRead>(`/organizations/${orgId}/members/invite`, {
      method: "POST",
      body: data,
      token,
    });
  },

  joinOrg(token: string, orgId: string) {
    return apiClient<MembershipRead>(`/organizations/${orgId}/members/join`, {
      method: "POST",
      token,
    });
  },

  approveMember(token: string, orgId: string, memberId: string, data: MembershipApprove) {
    return apiClient<MembershipRead>(
      `/organizations/${orgId}/members/${memberId}/approve`,
      { method: "PATCH", body: data, token }
    );
  },

  updateMemberRole(token: string, orgId: string, memberId: string, data: MembershipRoleUpdate) {
    return apiClient<MembershipRead>(
      `/organizations/${orgId}/members/${memberId}/role`,
      { method: "PATCH", body: data, token }
    );
  },

  removeMember(token: string, orgId: string, memberId: string) {
    return apiClient<void>(`/organizations/${orgId}/members/${memberId}`, {
      method: "DELETE",
      token,
    });
  },

  // New — available categories for listing form
  availableCategories(token: string, orgId: string) {
    return apiClient<ListingCategoryRead[]>(
      `/organizations/${orgId}/listings/categories/available/`,
      { token }
    );
  },
};
```

- [ ] **Step 5: Extend listings API with org-scoped CRUD**

Add to `src/lib/api/listings.ts`:

```typescript
import type {
  ListingCreate,
  ListingUpdate,
  ListingStatusUpdate,
  ListingCategoryCreate,
  OrgListingsQueryParams,
} from "@/types/listing";

// Add these methods to the existing listingsApi object:

  // Org-scoped
  orgList(token: string, orgId: string, params?: OrgListingsQueryParams) {
    return apiClient<PaginatedResponse<ListingRead>>(
      `/organizations/${orgId}/listings/`,
      {
        token,
        params: params as Record<string, string | number | boolean | null | undefined>,
      }
    );
  },

  orgGet(token: string, orgId: string, listingId: string) {
    return apiClient<ListingRead>(
      `/organizations/${orgId}/listings/${listingId}`,
      { token }
    );
  },

  orgCreate(token: string, orgId: string, data: ListingCreate) {
    return apiClient<ListingRead>(`/organizations/${orgId}/listings/`, {
      method: "POST",
      body: data,
      token,
    });
  },

  orgUpdate(token: string, orgId: string, listingId: string, data: ListingUpdate) {
    return apiClient<ListingRead>(
      `/organizations/${orgId}/listings/${listingId}`,
      { method: "PATCH", body: data, token }
    );
  },

  orgDelete(token: string, orgId: string, listingId: string) {
    return apiClient<void>(`/organizations/${orgId}/listings/${listingId}`, {
      method: "DELETE",
      token,
    });
  },

  orgUpdateStatus(token: string, orgId: string, listingId: string, data: ListingStatusUpdate) {
    return apiClient<ListingRead>(
      `/organizations/${orgId}/listings/${listingId}/status`,
      { method: "PATCH", body: data, token }
    );
  },

  orgCreateCategory(token: string, orgId: string, data: ListingCategoryCreate) {
    return apiClient<ListingCategoryRead>(
      `/organizations/${orgId}/listings/categories/`,
      { method: "POST", body: data, token }
    );
  },
```

- [ ] **Step 6: Extend users API**

Add to `src/lib/api/users.ts`:

```typescript
import type { MembershipRead } from "@/types/organization";

// Add these methods to the existing usersApi object:

  getById(userId: string) {
    return apiClient<UserRead>(`/users/${userId}`);
  },

  myOrganizations(token: string) {
    return apiClient<MembershipRead[]>("/users/me/organizations", { token });
  },

  search(token: string, params: { email: string; limit?: number }) {
    return apiClient<UserRead[]>("/users/search", {
      token,
      params: params as Record<string, string | number | boolean | null | undefined>,
    });
  },
```

- [ ] **Step 7: Verify build passes**

Run: `npx next build 2>&1 | tail -20` (or `npm run build`)
Expected: build succeeds with no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/types/organization.ts src/types/dadata.ts src/types/listing.ts src/lib/api/organizations.ts src/lib/api/listings.ts src/lib/api/users.ts
git commit -m "feat(slice-d): add types and API methods for org dashboard"
```

---

### Task 2: Org Context Store & Hooks

**Files:**
- Create: `src/lib/stores/org-store.ts`
- Create: `src/lib/hooks/use-org.ts`
- Create: `src/lib/hooks/use-org-guard.ts`
- Modify: `src/lib/hooks/use-auth.ts` (clear org context on logout)
- Test: `src/lib/stores/__tests__/org-store.test.ts`

- [ ] **Step 1: Write test for org store**

Create `src/lib/stores/__tests__/org-store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useOrgStore } from "../org-store";

describe("org-store", () => {
  beforeEach(() => {
    useOrgStore.getState().clearOrgContext();
  });

  it("starts with null org context", () => {
    const state = useOrgStore.getState();
    expect(state.currentOrg).toBeNull();
    expect(state.membership).toBeNull();
    expect(state.organizations).toEqual([]);
  });

  it("sets organizations and selects first", () => {
    const memberships = [
      { id: "m1", user_id: "u1", organization_id: "org1", role: "admin" as const, status: "member" as const, created_at: "", updated_at: "" },
      { id: "m2", user_id: "u1", organization_id: "org2", role: "viewer" as const, status: "member" as const, created_at: "", updated_at: "" },
    ];
    useOrgStore.getState().setOrganizations(memberships);
    const state = useOrgStore.getState();
    expect(state.organizations).toHaveLength(2);
  });

  it("switches org by id", () => {
    const memberships = [
      { id: "m1", user_id: "u1", organization_id: "org1", role: "admin" as const, status: "member" as const, created_at: "", updated_at: "" },
      { id: "m2", user_id: "u1", organization_id: "org2", role: "viewer" as const, status: "member" as const, created_at: "", updated_at: "" },
    ];
    useOrgStore.getState().setOrganizations(memberships);
    useOrgStore.getState().switchOrg("org2");
    const state = useOrgStore.getState();
    expect(state.membership?.organization_id).toBe("org2");
    expect(state.membership?.role).toBe("viewer");
  });

  it("clearOrgContext resets everything", () => {
    const memberships = [
      { id: "m1", user_id: "u1", organization_id: "org1", role: "admin" as const, status: "member" as const, created_at: "", updated_at: "" },
    ];
    useOrgStore.getState().setOrganizations(memberships);
    useOrgStore.getState().switchOrg("org1");
    useOrgStore.getState().clearOrgContext();
    const state = useOrgStore.getState();
    expect(state.currentOrg).toBeNull();
    expect(state.membership).toBeNull();
    expect(state.organizations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/stores/__tests__/org-store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement org store**

Create `src/lib/stores/org-store.ts`:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrganizationRead, MembershipRead } from "@/types/organization";

interface OrgState {
  currentOrg: OrganizationRead | null;
  membership: MembershipRead | null;
  organizations: MembershipRead[];
  switchOrg: (orgId: string) => void;
  setCurrentOrg: (org: OrganizationRead) => void;
  setOrganizations: (memberships: MembershipRead[]) => void;
  clearOrgContext: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      currentOrg: null,
      membership: null,
      organizations: [],

      switchOrg: (orgId: string) => {
        const membership = get().organizations.find(
          (m) => m.organization_id === orgId
        );
        if (membership) {
          set({ membership, currentOrg: null });
        }
      },

      setCurrentOrg: (org: OrganizationRead) => {
        set({ currentOrg: org });
      },

      setOrganizations: (memberships: MembershipRead[]) => {
        set({ organizations: memberships });
      },

      clearOrgContext: () =>
        set({
          currentOrg: null,
          membership: null,
          organizations: [],
        }),
    }),
    {
      name: "equip-me-org",
      partialize: (state) => ({
        membership: state.membership,
        organizations: state.organizations,
      }),
    }
  )
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/stores/__tests__/org-store.test.ts`
Expected: PASS

- [ ] **Step 5: Create useOrg hook**

Create `src/lib/hooks/use-org.ts`:

```typescript
"use client";

import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgStore } from "@/lib/stores/org-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usersApi } from "@/lib/api/users";
import { organizationsApi } from "@/lib/api/organizations";

export function useOrg() {
  const token = useAuthStore((s) => s.token);
  const {
    currentOrg,
    membership,
    organizations,
    switchOrg: storeSwitchOrg,
    setCurrentOrg,
    setOrganizations,
    clearOrgContext,
  } = useOrgStore();
  const queryClient = useQueryClient();

  const fetchOrganizations = useCallback(async () => {
    if (!token) return [];
    const memberships = await usersApi.myOrganizations(token);
    setOrganizations(memberships);
    return memberships;
  }, [token, setOrganizations]);

  const fetchCurrentOrg = useCallback(async (orgId: string) => {
    const org = await organizationsApi.get(orgId);
    setCurrentOrg(org);
    return org;
  }, [setCurrentOrg]);

  const switchOrg = useCallback(
    async (orgId: string) => {
      storeSwitchOrg(orgId);
      const org = await organizationsApi.get(orgId);
      setCurrentOrg(org);
      queryClient.invalidateQueries({ queryKey: ["org-listings"] });
      queryClient.invalidateQueries({ queryKey: ["org-listing-categories"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    [storeSwitchOrg, setCurrentOrg, queryClient]
  );

  return {
    currentOrg,
    membership,
    organizations,
    fetchOrganizations,
    fetchCurrentOrg,
    switchOrg,
    clearOrgContext,
  };
}
```

- [ ] **Step 6: Create useOrgGuard hook**

Create `src/lib/hooks/use-org-guard.ts`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useOrgStore } from "@/lib/stores/org-store";
import { useTranslations } from "next-intl";
import type { MembershipRole } from "@/types/organization";

const roleHierarchy: Record<MembershipRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
};

export function useOrgGuard(minRole: MembershipRole = "viewer") {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const membership = useOrgStore((s) => s.membership);

  useEffect(() => {
    if (!membership) return;
    if (roleHierarchy[membership.role] < roleHierarchy[minRole]) {
      toast.error(t("dashboard.permissionDenied"));
      router.replace(`/${locale}/org/listings`);
    }
  }, [membership, minRole, locale, router, t]);

  const hasRole = membership
    ? roleHierarchy[membership.role] >= roleHierarchy[minRole]
    : false;

  return { hasRole, role: membership?.role ?? null };
}
```

- [ ] **Step 7: Wire logout to clear org context**

In `src/lib/hooks/use-auth.ts`, import `useOrgStore` and add `useOrgStore.getState().clearOrgContext()` inside the `logout` function, right before or after `clearAuth()`.

- [ ] **Step 8: Run tests**

Run: `npx vitest run src/lib/stores/__tests__/org-store.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/stores/org-store.ts src/lib/hooks/use-org.ts src/lib/hooks/use-org-guard.ts src/lib/hooks/use-auth.ts src/lib/stores/__tests__/org-store.test.ts
git commit -m "feat(slice-d): add org context store and hooks"
```

---

### Task 3: i18n Translations

**Files:**
- Modify: `src/lib/i18n/messages/en.json`
- Modify: `src/lib/i18n/messages/ru.json`

- [ ] **Step 1: Add all Slice D keys to en.json**

Add the following top-level sections to `en.json` (alongside existing sections like `common`, `nav`, `settings`, etc.):

```json
  "dashboard": {
    "sidebar": {
      "listings": "Listings",
      "members": "Members",
      "settings": "Settings",
      "switchOrg": "Switch organization"
    },
    "noOrgs": "You need to create or join an organization first",
    "permissionDenied": "You don't have permission to access this page"
  },
  "orgCreate": {
    "title": "Create Organization",
    "search": {
      "label": "Organization",
      "placeholder": "Enter organization name or INN",
      "noResults": "No organizations found"
    },
    "details": {
      "fullName": "Full name",
      "shortName": "Short name",
      "inn": "INN",
      "address": "Legal address",
      "manager": "Manager"
    },
    "photo": {
      "label": "Organization photo"
    },
    "contacts": {
      "title": "Contacts",
      "add": "Add contact",
      "remove": "Remove",
      "displayName": "Contact name",
      "phone": "Phone",
      "email": "Email",
      "minOne": "At least one contact is required"
    },
    "submit": "Create organization",
    "success": "Organization created",
    "error": {
      "innRequired": "Select an organization from the list",
      "alreadyExists": "Organization with this INN already exists"
    }
  },
  "joinOrg": {
    "title": "Join Organization",
    "search": {
      "placeholder": "Search by name",
      "noResults": "No organizations found"
    },
    "submit": "Send request",
    "success": "Request sent, waiting for admin approval",
    "error": {
      "alreadyMember": "You are already a member or have a pending request"
    }
  },
  "orgListings": {
    "title": "Listings",
    "create": "Create listing",
    "search": {
      "placeholder": "Search listings..."
    },
    "filter": {
      "allStatuses": "All statuses",
      "allCategories": "All categories"
    },
    "empty": "No listings yet",
    "emptyFiltered": "No listings match your filters",
    "actions": {
      "edit": "Edit",
      "delete": "Delete",
      "changeStatus": "Change status",
      "publish": "Publish",
      "hide": "Hide",
      "archive": "Archive"
    },
    "deleteConfirm": "Delete this listing? This cannot be undone.",
    "statusChanged": "Listing status updated",
    "deleted": "Listing deleted"
  },
  "listingForm": {
    "createTitle": "Create Listing",
    "editTitle": "Edit Listing",
    "name": "Name",
    "category": "Category",
    "categoryCreate": "Create new category",
    "categoryName": "Category name",
    "price": "Price",
    "pricePerDay": "per day",
    "description": "Description",
    "descriptionHint": "Supports Markdown",
    "specs": {
      "title": "Specifications",
      "key": "Name",
      "value": "Value",
      "add": "Add specification"
    },
    "flags": {
      "title": "Service options",
      "withOperator": "With operator",
      "onOwnerSite": "On owner's site",
      "delivery": "Delivery",
      "installation": "Installation",
      "setup": "Setup"
    },
    "photos": {
      "title": "Photos",
      "upload": "Upload photos",
      "limit": "{count} / {max} photos",
      "maxReached": "Maximum photos reached",
      "invalidType": "Only JPEG, PNG, and WebP images are allowed",
      "tooLarge": "File is too large (max 10 MB)"
    },
    "save": "Save",
    "delete": "Delete listing",
    "created": "Listing created",
    "updated": "Listing updated",
    "validation": {
      "nameRequired": "Name is required",
      "categoryRequired": "Category is required",
      "priceRequired": "Price is required",
      "pricePositive": "Price must be greater than 0"
    }
  },
  "members": {
    "title": "Members",
    "tabs": {
      "members": "Members",
      "pending": "Pending Requests",
      "invitations": "Invitations"
    },
    "role": {
      "admin": "Admin",
      "editor": "Editor",
      "viewer": "Viewer"
    },
    "actions": {
      "changeRole": "Change role",
      "remove": "Remove",
      "approve": "Approve",
      "reject": "Reject",
      "cancelInvite": "Cancel invitation"
    },
    "removeConfirm": "Remove {name} from the organization?",
    "roleChanged": "Role updated",
    "removed": "Member removed",
    "approved": "Member approved",
    "rejected": "Request rejected",
    "inviteCanceled": "Invitation canceled",
    "empty": {
      "members": "No members yet",
      "pending": "No pending requests",
      "invitations": "No pending invitations"
    }
  },
  "invite": {
    "title": "Invite Member",
    "search": {
      "label": "User email",
      "placeholder": "Search by email",
      "noResults": "No users found for this email",
      "minChars": "Type at least 3 characters"
    },
    "role": {
      "label": "Role"
    },
    "submit": "Send invitation",
    "success": "Invitation sent",
    "error": {
      "alreadyMember": "User is already a member or has a pending invitation"
    }
  },
  "orgSettings": {
    "title": "Organization Settings",
    "profile": {
      "title": "Organization Profile",
      "photo": "Organization photo",
      "info": "Organization details",
      "fullName": "Full name",
      "shortName": "Short name",
      "inn": "INN",
      "address": "Legal address",
      "manager": "Manager",
      "registrationDate": "Registration date",
      "status": "Status"
    },
    "contacts": {
      "title": "Contacts",
      "save": "Save contacts",
      "saved": "Contacts saved"
    }
  }
```

- [ ] **Step 2: Add all Slice D keys to ru.json**

Add the corresponding Russian translations:

```json
  "dashboard": {
    "sidebar": {
      "listings": "Объявления",
      "members": "Участники",
      "settings": "Настройки",
      "switchOrg": "Сменить организацию"
    },
    "noOrgs": "Сначала нужно создать организацию или вступить в существующую",
    "permissionDenied": "У вас нет доступа к этой странице"
  },
  "orgCreate": {
    "title": "Создать организацию",
    "search": {
      "label": "Организация",
      "placeholder": "Введите название или ИНН",
      "noResults": "Организации не найдены"
    },
    "details": {
      "fullName": "Полное название",
      "shortName": "Сокращённое название",
      "inn": "ИНН",
      "address": "Юридический адрес",
      "manager": "Руководитель"
    },
    "photo": {
      "label": "Фото организации"
    },
    "contacts": {
      "title": "Контакты",
      "add": "Добавить контакт",
      "remove": "Удалить",
      "displayName": "Имя контакта",
      "phone": "Телефон",
      "email": "Email",
      "minOne": "Необходимо указать хотя бы один контакт"
    },
    "submit": "Создать организацию",
    "success": "Организация создана",
    "error": {
      "innRequired": "Выберите организацию из списка",
      "alreadyExists": "Организация с таким ИНН уже существует"
    }
  },
  "joinOrg": {
    "title": "Вступить в организацию",
    "search": {
      "placeholder": "Поиск по названию",
      "noResults": "Организации не найдены"
    },
    "submit": "Отправить заявку",
    "success": "Заявка отправлена, ожидайте одобрения администратора",
    "error": {
      "alreadyMember": "Вы уже являетесь участником или имеете ожидающую заявку"
    }
  },
  "orgListings": {
    "title": "Объявления",
    "create": "Создать объявление",
    "search": {
      "placeholder": "Поиск объявлений..."
    },
    "filter": {
      "allStatuses": "Все статусы",
      "allCategories": "Все категории"
    },
    "empty": "Объявлений пока нет",
    "emptyFiltered": "Нет объявлений, соответствующих фильтрам",
    "actions": {
      "edit": "Редактировать",
      "delete": "Удалить",
      "changeStatus": "Изменить статус",
      "publish": "Опубликовать",
      "hide": "Скрыть",
      "archive": "В архив"
    },
    "deleteConfirm": "Удалить объявление? Это действие нельзя отменить.",
    "statusChanged": "Статус объявления обновлён",
    "deleted": "Объявление удалено"
  },
  "listingForm": {
    "createTitle": "Создать объявление",
    "editTitle": "Редактировать объявление",
    "name": "Название",
    "category": "Категория",
    "categoryCreate": "Создать категорию",
    "categoryName": "Название категории",
    "price": "Цена",
    "pricePerDay": "в день",
    "description": "Описание",
    "descriptionHint": "Поддерживается Markdown",
    "specs": {
      "title": "Характеристики",
      "key": "Название",
      "value": "Значение",
      "add": "Добавить характеристику"
    },
    "flags": {
      "title": "Услуги",
      "withOperator": "С оператором",
      "onOwnerSite": "На площадке владельца",
      "delivery": "Доставка",
      "installation": "Монтаж",
      "setup": "Настройка"
    },
    "photos": {
      "title": "Фото",
      "upload": "Загрузить фото",
      "limit": "{count} / {max} фото",
      "maxReached": "Достигнут максимум фото",
      "invalidType": "Допускаются только JPEG, PNG и WebP",
      "tooLarge": "Файл слишком большой (макс. 10 МБ)"
    },
    "save": "Сохранить",
    "delete": "Удалить объявление",
    "created": "Объявление создано",
    "updated": "Объявление обновлено",
    "validation": {
      "nameRequired": "Название обязательно",
      "categoryRequired": "Категория обязательна",
      "priceRequired": "Цена обязательна",
      "pricePositive": "Цена должна быть больше 0"
    }
  },
  "members": {
    "title": "Участники",
    "tabs": {
      "members": "Участники",
      "pending": "Заявки",
      "invitations": "Приглашения"
    },
    "role": {
      "admin": "Администратор",
      "editor": "Редактор",
      "viewer": "Наблюдатель"
    },
    "actions": {
      "changeRole": "Изменить роль",
      "remove": "Удалить",
      "approve": "Одобрить",
      "reject": "Отклонить",
      "cancelInvite": "Отменить приглашение"
    },
    "removeConfirm": "Удалить {name} из организации?",
    "roleChanged": "Роль обновлена",
    "removed": "Участник удалён",
    "approved": "Участник одобрен",
    "rejected": "Заявка отклонена",
    "inviteCanceled": "Приглашение отменено",
    "empty": {
      "members": "Участников пока нет",
      "pending": "Нет ожидающих заявок",
      "invitations": "Нет ожидающих приглашений"
    }
  },
  "invite": {
    "title": "Пригласить участника",
    "search": {
      "label": "Email пользователя",
      "placeholder": "Поиск по email",
      "noResults": "Пользователь не найден",
      "minChars": "Введите минимум 3 символа"
    },
    "role": {
      "label": "Роль"
    },
    "submit": "Отправить приглашение",
    "success": "Приглашение отправлено",
    "error": {
      "alreadyMember": "Пользователь уже является участником или имеет ожидающую заявку"
    }
  },
  "orgSettings": {
    "title": "Настройки организации",
    "profile": {
      "title": "Профиль организации",
      "photo": "Фото организации",
      "info": "Данные организации",
      "fullName": "Полное название",
      "shortName": "Сокращённое название",
      "inn": "ИНН",
      "address": "Юридический адрес",
      "manager": "Руководитель",
      "registrationDate": "Дата регистрации",
      "status": "Статус"
    },
    "contacts": {
      "title": "Контакты",
      "save": "Сохранить контакты",
      "saved": "Контакты сохранены"
    }
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/i18n/messages/en.json src/lib/i18n/messages/ru.json
git commit -m "feat(slice-d): add i18n translations for org dashboard"
```

---

### Task 4: Validators

**Files:**
- Create: `src/lib/validators/organization.ts`
- Create: `src/lib/validators/listing.ts`
- Test: `src/lib/validators/__tests__/organization.test.ts`
- Test: `src/lib/validators/__tests__/listing.test.ts`

- [ ] **Step 1: Write tests for org validators**

Create `src/lib/validators/__tests__/organization.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { orgCreateSchema, contactSchema } from "../organization";

describe("contactSchema", () => {
  it("accepts valid contact with all fields", () => {
    const result = contactSchema.safeParse({
      display_name: "John",
      phone: "+7 (999) 123-45-67",
      email: "john@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts contact with only display_name", () => {
    const result = contactSchema.safeParse({ display_name: "John" });
    expect(result.success).toBe(true);
  });

  it("rejects empty display_name", () => {
    const result = contactSchema.safeParse({ display_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone format", () => {
    const result = contactSchema.safeParse({
      display_name: "John",
      phone: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = contactSchema.safeParse({
      display_name: "John",
      email: "not-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("orgCreateSchema", () => {
  it("accepts valid org with inn and contacts", () => {
    const result = orgCreateSchema.safeParse({
      inn: "1234567890",
      contacts: [{ display_name: "Main Office" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing inn", () => {
    const result = orgCreateSchema.safeParse({
      inn: "",
      contacts: [{ display_name: "Office" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty contacts array", () => {
    const result = orgCreateSchema.safeParse({
      inn: "1234567890",
      contacts: [],
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/validators/__tests__/organization.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement org validators**

Create `src/lib/validators/organization.ts`:

```typescript
import { z } from "zod";

export const contactSchema = z.object({
  display_name: z.string().min(1, "displayNameRequired"),
  phone: z
    .string()
    .regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, "phoneInvalid")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("emailInvalid")
    .optional()
    .or(z.literal("")),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const orgCreateSchema = z.object({
  inn: z.string().min(1, "innRequired"),
  contacts: z.array(contactSchema).min(1, "contactsMinOne"),
});

export type OrgCreateFormData = z.infer<typeof orgCreateSchema>;

export const contactsReplaceSchema = z.object({
  contacts: z.array(contactSchema).min(1, "contactsMinOne"),
});

export type ContactsReplaceFormData = z.infer<typeof contactsReplaceSchema>;
```

- [ ] **Step 4: Run org validator tests**

Run: `npx vitest run src/lib/validators/__tests__/organization.test.ts`
Expected: PASS

- [ ] **Step 5: Write tests for listing validators**

Create `src/lib/validators/__tests__/listing.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { listingSchema } from "../listing";

describe("listingSchema", () => {
  it("accepts valid listing with required fields", () => {
    const result = listingSchema.safeParse({
      name: "Excavator",
      category_id: "cat-1",
      price: 15000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = listingSchema.safeParse({
      name: "",
      category_id: "cat-1",
      price: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero price", () => {
    const result = listingSchema.safeParse({
      name: "Crane",
      category_id: "cat-1",
      price: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = listingSchema.safeParse({
      name: "Crane",
      category_id: "cat-1",
      price: -10,
    });
    expect(result.success).toBe(false);
  });

  it("accepts listing with all optional fields", () => {
    const result = listingSchema.safeParse({
      name: "Crane",
      category_id: "cat-1",
      price: 50000,
      description: "Big crane",
      with_operator: true,
      delivery: true,
      photo_ids: ["id1", "id2"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 10 photos", () => {
    const result = listingSchema.safeParse({
      name: "Crane",
      category_id: "cat-1",
      price: 100,
      photo_ids: Array.from({ length: 11 }, (_, i) => `id-${i}`),
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/lib/validators/__tests__/listing.test.ts`
Expected: FAIL

- [ ] **Step 7: Implement listing validators**

Create `src/lib/validators/listing.ts`:

```typescript
import { z } from "zod";

export const listingSchema = z.object({
  name: z.string().min(1, "nameRequired"),
  category_id: z.string().min(1, "categoryRequired"),
  price: z.number().gt(0, "pricePositive"),
  description: z.string().optional().default(""),
  specifications: z.record(z.string(), z.string()).optional(),
  with_operator: z.boolean().optional().default(false),
  on_owner_site: z.boolean().optional().default(false),
  delivery: z.boolean().optional().default(false),
  installation: z.boolean().optional().default(false),
  setup: z.boolean().optional().default(false),
  photo_ids: z.array(z.string()).max(10, "tooManyPhotos").optional().default([]),
});

export type ListingFormData = z.infer<typeof listingSchema>;
```

- [ ] **Step 8: Run listing validator tests**

Run: `npx vitest run src/lib/validators/__tests__/listing.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/validators/organization.ts src/lib/validators/listing.ts src/lib/validators/__tests__/
git commit -m "feat(slice-d): add Zod validators for org and listing forms"
```

---

### Task 5: Dadata Proxy & DadataSuggest Component

**Files:**
- Create: `src/app/api/dadata/suggest/route.ts`
- Create: `src/components/org/dadata-suggest.tsx`

- [ ] **Step 1: Create Dadata proxy API route**

Create `src/app/api/dadata/suggest/route.ts`:

```typescript
import { type NextRequest, NextResponse } from "next/server";

const DADATA_URL =
  "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party";
const DADATA_API_KEY = process.env.DADATA_API_KEY ?? "";

export async function POST(request: NextRequest) {
  if (!DADATA_API_KEY) {
    return NextResponse.json(
      { detail: "Dadata API key not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const query = body.query;

  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { detail: "query is required" },
      { status: 400 }
    );
  }

  const res = await fetch(DADATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Token ${DADATA_API_KEY}`,
    },
    body: JSON.stringify({ query, count: 5 }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { detail: "Dadata request failed" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Create DadataSuggest component**

Create `src/components/org/dadata-suggest.tsx`:

```typescript
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DadataSuggestion } from "@/types/dadata";

interface DadataSuggestProps {
  onSelect: (suggestion: DadataSuggestion) => void;
  disabled?: boolean;
}

export function DadataSuggest({ onSelect, disabled }: DadataSuggestProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DadataSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/dadata/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setIsOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSelect = (suggestion: DadataSuggestion) => {
    setQuery(suggestion.value);
    setIsOpen(false);
    setSuggestions([]);
    onSelect(suggestion);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleChange}
          placeholder={t("orgCreate.search.placeholder")}
          className="pl-9"
          disabled={disabled}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={`${s.data.inn}-${i}`}
              type="button"
              className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
              onClick={() => handleSelect(s)}
            >
              <span className="text-sm font-medium">{s.value}</span>
              <span className="text-xs text-muted-foreground">
                {t("orgCreate.details.inn")}: {s.data.inn}
                {s.data.address?.value && ` · ${s.data.address.value}`}
              </span>
            </button>
          ))}
        </div>
      )}
      {isOpen && suggestions.length === 0 && !isLoading && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 bg-white p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{t("orgCreate.search.noResults")}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/dadata/suggest/route.ts src/components/org/dadata-suggest.tsx
git commit -m "feat(slice-d): add Dadata proxy route and suggest component"
```

---

### Task 6: ContactsEditor Component

**Files:**
- Create: `src/components/org/contacts-editor.tsx`

- [ ] **Step 1: Create ContactsEditor**

Create `src/components/org/contacts-editor.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import {
  useFieldArray,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/shared/phone-input";

interface ContactsEditorProps {
  control: Control<{ contacts: { display_name: string; phone?: string; email?: string }[] }>;
  errors: FieldErrors<{ contacts: { display_name: string; phone?: string; email?: string }[] }>;
  register: ReturnType<typeof import("react-hook-form").useForm>["register"];
}

export function ContactsEditor({ control, errors, register }: ContactsEditorProps) {
  const t = useTranslations();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border border-zinc-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {t("orgCreate.contacts.title")} #{index + 1}
            </span>
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
                {t("orgCreate.contacts.remove")}
              </Button>
            )}
          </div>

          <div>
            <Label>{t("orgCreate.contacts.displayName")}</Label>
            <Input
              {...register(`contacts.${index}.display_name`)}
              placeholder={t("orgCreate.contacts.displayName")}
            />
            {errors.contacts?.[index]?.display_name && (
              <p className="mt-1 text-sm text-destructive">
                {t(`settings.validation.${errors.contacts[index].display_name.message}`)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("orgCreate.contacts.phone")}</Label>
              <PhoneInput
                value={(control._getWatch(`contacts.${index}.phone`) as string) ?? ""}
                onChange={(val) => control._formValues && control._subjects?.values?.next?.({
                  ...control._formValues,
                  contacts: control._formValues.contacts.map(
                    (c: Record<string, string>, i: number) => i === index ? { ...c, phone: val } : c
                  ),
                })}
              />
            </div>
            <div>
              <Label>{t("orgCreate.contacts.email")}</Label>
              <Input
                {...register(`contacts.${index}.email`)}
                type="email"
                placeholder="email@example.com"
              />
              {errors.contacts?.[index]?.email && (
                <p className="mt-1 text-sm text-destructive">
                  {t(`settings.validation.${errors.contacts[index].email.message}`)}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ display_name: "", phone: "", email: "" })}
        className="w-full"
      >
        <Plus className="size-4" />
        {t("orgCreate.contacts.add")}
      </Button>
    </div>
  );
}
```

Note: The `PhoneInput` integration with react-hook-form needs a `Controller` wrapper. The implementing agent should use `<Controller name={`contacts.${index}.phone`} control={control} render={({ field }) => <PhoneInput {...field} />} />` instead of the manual wiring above. Adjust during implementation to match the pattern in `src/components/settings/profile-form.tsx`.

- [ ] **Step 2: Commit**

```bash
git add src/components/org/contacts-editor.tsx
git commit -m "feat(slice-d): add ContactsEditor component"
```

---

### Task 7: Dashboard Layout, Sidebar & Org Switcher

**Files:**
- Modify: `src/app/[locale]/(dashboard)/layout.tsx`
- Create: `src/components/layout/org-sidebar.tsx`
- Create: `src/components/layout/org-switcher.tsx`

- [ ] **Step 1: Implement dashboard layout**

Replace `src/app/[locale]/(dashboard)/layout.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrg } from "@/lib/hooks/use-org";
import { OrgSidebar } from "@/components/layout/org-sidebar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { membership, fetchOrganizations, fetchCurrentOrg } = useOrg();

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
      return;
    }

    (async () => {
      try {
        const memberships = await fetchOrganizations();
        if (memberships.length === 0) {
          router.replace(`/${locale}/organizations/new`);
          return;
        }
        // Auto-select first org if none selected
        const currentMembership =
          useOrgStore.getState().membership;
        const orgId =
          currentMembership?.organization_id ??
          memberships[0].organization_id;
        if (!currentMembership) {
          useOrgStore.getState().switchOrg(orgId);
        }
        await fetchCurrentOrg(orgId);
      } finally {
        setLoading(false);
      }
    })();
  }, [hydrated, isAuthenticated, locale, router, fetchOrganizations, fetchCurrentOrg]);

  if (!hydrated || !isAuthenticated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!membership) return null;

  return (
    <div className="flex min-h-screen">
      <OrgSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

**Important:** The implementing agent must add `import { useOrgStore } from "@/lib/stores/org-store"` to the imports at the top of this file.

- [ ] **Step 2: Implement OrgSidebar**

Create `src/components/layout/org-sidebar.tsx`:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LayoutGrid, Users, Settings, Menu, X } from "lucide-react";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrgGuard } from "@/lib/hooks/use-org-guard";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/org/listings", labelKey: "dashboard.sidebar.listings", icon: LayoutGrid, minRole: "viewer" as const },
  { href: "/org/members", labelKey: "dashboard.sidebar.members", icon: Users, minRole: "viewer" as const },
  { href: "/org/settings", labelKey: "dashboard.sidebar.settings", icon: Settings, minRole: "admin" as const },
];

function SidebarContent() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const membership = useOrgStore((s) => s.membership);
  const { hasRole } = useOrgGuard("viewer");

  const initials = currentOrg?.short_name
    ? currentOrg.short_name.slice(0, 2).toUpperCase()
    : "??";

  return (
    <div className="flex h-full flex-col">
      {/* Org header */}
      <div className="border-b border-zinc-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 rounded-md">
            <AvatarFallback className="rounded-md text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {currentOrg?.short_name || currentOrg?.full_name || "..."}
            </p>
            {membership && (
              <Badge variant="secondary" className="text-[10px]">
                {t(`members.role.${membership.role}`)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, labelKey, icon: Icon, minRole }) => {
          if (minRole === "admin" && membership?.role !== "admin") return null;
          const fullHref = `/${locale}${href}`;
          const isActive = pathname.startsWith(fullHref);
          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-zinc-100 font-medium text-black"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-black"
              )}
            >
              <Icon className="size-4" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Org switcher at bottom */}
      <div className="border-t border-zinc-200 p-3">
        <OrgSwitcher />
      </div>
    </div>
  );
}

export function OrgSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile header + sheet */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center border-b border-zinc-200 bg-white px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" showCloseButton={false} className="w-60 p-0">
            <div className="flex h-14 items-center justify-end border-b border-zinc-200 px-4">
              <SheetClose className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X className="size-4" />
              </SheetClose>
            </div>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
      {/* Spacer for mobile header */}
      <div className="h-14 lg:hidden" />
    </>
  );
}
```

- [ ] **Step 3: Implement OrgSwitcher**

Create `src/components/layout/org-switcher.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { ChevronsUpDown } from "lucide-react";
import { useOrg } from "@/lib/hooks/use-org";
import { useOrgStore } from "@/lib/stores/org-store";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function OrgSwitcher() {
  const t = useTranslations();
  const { organizations, switchOrg, membership } = useOrg();
  const currentOrg = useOrgStore((s) => s.currentOrg);

  if (organizations.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">
        <span className="truncate">{t("dashboard.sidebar.switchOrg")}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {organizations.map((m) => (
          <DropdownMenuItem
            key={m.organization_id}
            onClick={() => switchOrg(m.organization_id)}
            className={m.organization_id === membership?.organization_id ? "bg-zinc-100" : ""}
          >
            {m.organization_id === currentOrg?.id
              ? currentOrg.short_name || currentOrg.full_name
              : m.organization_id}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Note: The org switcher shows org IDs for non-current orgs since `MembershipRead` doesn't include org details. The implementing agent should consider caching org names from previous fetches, or simply displaying the current org name and refetching on switch.

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/(dashboard)/layout.tsx src/components/layout/org-sidebar.tsx src/components/layout/org-switcher.tsx
git commit -m "feat(slice-d): add dashboard layout with sidebar and org switcher"
```

---

### Task 8: Org Creation Page

**Files:**
- Create: `src/app/[locale]/(public)/organizations/new/page.tsx`

- [ ] **Step 1: Create org creation page**

Create `src/app/[locale]/(public)/organizations/new/page.tsx`. This is a client component with auth guard that composes:
- `DadataSuggest` at top
- Read-only org details (shown after selection)
- `AvatarUpload` for org photo (optional)
- `ContactsEditor` for contacts
- Submit button

The page uses `useForm` with `zodResolver(orgCreateSchema)`. On Dadata select, it stores the full suggestion data in local state and sets the `inn` field value. On submit:
1. `organizationsApi.create(token, { inn, contacts })`
2. If photo uploaded: `organizationsApi.updatePhoto(token, orgId, { photo_id })`
3. Fetch fresh memberships
4. Redirect to `/org/settings`

The avatar upload uses the same pattern as `avatar-section.tsx` but calls `organizationsApi.updatePhoto` instead of `usersApi.update`.

- [ ] **Step 2: Verify the page renders**

Run: `npm run dev` and navigate to `http://localhost:3000/ru/organizations/new` while logged in.
Expected: Page renders with Dadata search, contacts editor, submit button.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(public)/organizations/new/page.tsx
git commit -m "feat(slice-d): add organization creation page"
```

---

### Task 9: Join Org Dialog & UserMenu Update

**Files:**
- Create: `src/components/org/join-org-dialog.tsx`
- Modify: `src/components/layout/user-menu.tsx`

- [ ] **Step 1: Create JoinOrgDialog**

Create `src/components/org/join-org-dialog.tsx`. Modal dialog with:
- Search input (debounced 300ms) → `organizationsApi.list({ search })`
- Dropdown with org cards (photo, name, INN)
- On select → `organizationsApi.joinOrg(token, orgId)`
- Success toast, close dialog
- 409 error handling

Uses `Dialog` from `@/components/ui/dialog`.

- [ ] **Step 2: Update UserMenu to enable Join Org**

In `src/components/layout/user-menu.tsx`:
1. Import `JoinOrgDialog` and `useState`
2. Replace the disabled "Join organization" `DropdownMenuItem` with one that opens the dialog
3. Add `<JoinOrgDialog open={joinOpen} onOpenChange={setJoinOpen} />` below the dropdown

- [ ] **Step 3: Verify**

Run dev server, click user menu → "Join organization" should open dialog.

- [ ] **Step 4: Commit**

```bash
git add src/components/org/join-org-dialog.tsx src/components/layout/user-menu.tsx
git commit -m "feat(slice-d): add join org dialog and update user menu"
```

---

### Task 10: Install @dnd-kit & Build PhotoGrid

**Files:**
- Create: `src/components/org/photo-grid.tsx`

- [ ] **Step 1: Install @dnd-kit**

Run: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

- [ ] **Step 2: Create PhotoGrid component**

Create `src/components/org/photo-grid.tsx`. This component:
- Accepts `photos: { id: string; url: string }[]` and `onChange: (photos) => void`
- Drop zone with "Upload photos" button (hidden file input, accept `image/jpeg,image/png,image/webp`)
- Validates file type and size (max 10MB) before upload
- Shows "X / 10 photos" counter
- On file select: runs the presigned URL upload flow (same as avatar-section.tsx), appends to grid on ready
- Uses `@dnd-kit/sortable` for drag-and-drop reordering
- Each photo: thumbnail with remove (X) button and drag handle
- Calls `onChange` with updated array on reorder or remove
- Shows upload progress per in-flight upload

The implementing agent should reference `src/components/settings/avatar-section.tsx` for the upload flow pattern and adapt it for multiple concurrent uploads.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/org/photo-grid.tsx
git commit -m "feat(slice-d): add PhotoGrid with drag-and-drop and upload"
```

---

### Task 11: SpecsEditor, CategorySelect & ListingStatusSelect

**Files:**
- Create: `src/components/org/specs-editor.tsx`
- Create: `src/components/org/category-select.tsx`
- Create: `src/components/org/listing-status-select.tsx`

- [ ] **Step 1: Create SpecsEditor**

Create `src/components/org/specs-editor.tsx`. Dynamic key-value pair editor:
- `useFieldArray` pattern with `name="specifications_list"` (array of `{ key: string, value: string }`)
- Each row: key input + value input + remove button
- Add row button at bottom
- The parent form converts this array to `Record<string, string>` before submit

- [ ] **Step 2: Create CategorySelect**

Create `src/components/org/category-select.tsx`:
- Fetches categories via `organizationsApi.availableCategories(token, orgId)` using `useQuery` with key `["org-listing-categories", orgId]`
- Renders a `Select` dropdown with categories
- "Create new" option at bottom opens inline text input
- On create: `listingsApi.orgCreateCategory(token, orgId, { name })` → invalidate query → auto-select new category
- Props: `value: string`, `onChange: (categoryId: string) => void`, `orgId: string`

- [ ] **Step 3: Create ListingStatusSelect**

Create `src/components/org/listing-status-select.tsx`:
- Props: `currentStatus: ListingStatus`, `onStatusChange: (status: ListingStatus) => void`
- Shows current status as a badge
- Dropdown with allowed transitions:
  - `hidden` → publish
  - `published` → hide, archive
  - `archived` → hide

- [ ] **Step 4: Commit**

```bash
git add src/components/org/specs-editor.tsx src/components/org/category-select.tsx src/components/org/listing-status-select.tsx
git commit -m "feat(slice-d): add specs editor, category select, and status select"
```

---

### Task 12: ListingForm Component

**Files:**
- Create: `src/components/org/listing-form.tsx`

- [ ] **Step 1: Create ListingForm**

Create `src/components/org/listing-form.tsx`. Shared form for create and edit:

Props:
```typescript
interface ListingFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<ListingFormData>;
  existingPhotos?: { id: string; url: string }[];
  onSubmit: (data: ListingFormData) => Promise<void>;
  isSubmitting: boolean;
}
```

Uses `useForm` with `zodResolver(listingSchema)`. Sections:
1. Basic info: name (`Input`), category (`CategorySelect`), price (`Input` type number)
2. Description: `textarea`
3. Specifications: `SpecsEditor`
4. Service flags: 5 checkboxes (`Checkbox` + `Label`)
5. Photos: `PhotoGrid`

The form maintains a local `photos` state (array of `{ id, url }`) that syncs with `photo_ids` in the form. On submit, converts specs list to record, sets `photo_ids` from photos state.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/org/listing-form.tsx
git commit -m "feat(slice-d): add ListingForm component"
```

---

### Task 13: Listings Table Page

**Files:**
- Create: `src/app/[locale]/(dashboard)/org/listings/page.tsx`

- [ ] **Step 1: Create listings table page**

Create `src/app/[locale]/(dashboard)/org/listings/page.tsx`. Client component:
- Header: title + "Create listing" button (Link to `/org/listings/new`, visible to editor+)
- Filter row: search input (debounced 300ms), category select (from available categories), status filter select (all/hidden/published/archived)
- Desktop: table rows — photo thumbnail (40x40), name, category, price, status badge, actions dropdown menu (edit, change status submenu, delete)
- Mobile: card list
- Uses `useInfiniteQuery` with key `["org-listings", orgId, { search, status, category_id }]`
- Status change: `listingsApi.orgUpdateStatus` → invalidate query → toast
- Delete: `ConfirmDialog` → `listingsApi.orgDelete` → invalidate → toast
- Click row: navigate to edit page
- Empty state / filtered empty state
- Skeleton loading
- "Load more" button for pagination

- [ ] **Step 2: Verify**

Run dev server, navigate to `/ru/org/listings` (must be logged in with an org).
Expected: Page renders with table/empty state.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(dashboard)/org/listings/page.tsx
git commit -m "feat(slice-d): add listings table page with filters and status change"
```

---

### Task 14: Create & Edit Listing Pages

**Files:**
- Create: `src/app/[locale]/(dashboard)/org/listings/new/page.tsx`
- Create: `src/app/[locale]/(dashboard)/org/listings/[id]/edit/page.tsx`

- [ ] **Step 1: Create listing page**

Create `src/app/[locale]/(dashboard)/org/listings/new/page.tsx`:
- Auth guard + editor role guard
- Uses `ListingForm` in `mode="create"`
- On submit: `listingsApi.orgCreate(token, orgId, data)` → redirect to edit page → toast

- [ ] **Step 2: Edit listing page**

Create `src/app/[locale]/(dashboard)/org/listings/[id]/edit/page.tsx`:
- Auth guard + editor role guard
- Fetches listing with `useQuery` key `["org-listing", orgId, listingId]`
- Uses `ListingForm` in `mode="edit"` with `defaultValues` from fetched data
- `ListingStatusSelect` at top
- Delete button at bottom with `ConfirmDialog`
- On submit: `listingsApi.orgUpdate(token, orgId, listingId, data)` → invalidate → toast
- On delete: `listingsApi.orgDelete` → redirect to listings → toast
- Skeleton while loading

- [ ] **Step 3: Verify**

Navigate to `/ru/org/listings/new` — should show empty form.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/(dashboard)/org/listings/new/page.tsx src/app/[locale]/(dashboard)/org/listings/[id]/edit/page.tsx
git commit -m "feat(slice-d): add create and edit listing pages"
```

---

### Task 15: Members Page

**Files:**
- Create: `src/app/[locale]/(dashboard)/org/members/page.tsx`
- Create: `src/components/org/member-table.tsx`

- [ ] **Step 1: Create MemberTable component**

Create `src/components/org/member-table.tsx`:
- Props: `members: MembershipRead[]`, `users: Record<string, UserRead>`, `tab: "members" | "pending" | "invitations"`, `isAdmin: boolean`, `currentUserId: string`
- Renders table with avatar, name, email, role badge (members tab), date
- Actions per tab (admin only):
  - Members: role dropdown, remove button
  - Pending: approve (with role select popover), reject
  - Invitations: cancel
- Uses `ConfirmDialog` for remove/reject/cancel
- Calls appropriate API methods on action, invalidates `["members", orgId]`

- [ ] **Step 2: Create members page**

Create `src/app/[locale]/(dashboard)/org/members/page.tsx`:
- Tabs component (Members | Pending Requests | Invitations) — use simple button group or custom tabs
- Fetches all members with `useInfiniteQuery` key `["members", orgId]`
- Filters client-side by `status` for each tab
- For each page of members, fetches user details with `useQueries` → `usersApi.getById(userId)` with key `["user", userId]`
- "Invite member" button (Link to `/org/members/invite`, admin only)
- Empty states per tab

- [ ] **Step 3: Verify**

Navigate to `/ru/org/members` — should show tabbed member list.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/(dashboard)/org/members/page.tsx src/components/org/member-table.tsx
git commit -m "feat(slice-d): add members page with tabs and actions"
```

---

### Task 16: Invite Member Page

**Files:**
- Create: `src/app/[locale]/(dashboard)/org/members/invite/page.tsx`
- Create: `src/components/org/user-search.tsx`

- [ ] **Step 1: Create UserSearch component**

Create `src/components/org/user-search.tsx`:
- Props: `onSelect: (user: UserRead) => void`, `selectedUser: UserRead | null`, `onClear: () => void`
- Email input (debounced 300ms) → `usersApi.search(token, { email, limit: 5 })` via `useQuery` key `["user-search", email]`, enabled when email.length >= 3
- Dropdown shows matching users: avatar, full name, email
- On select: shows user card below input with X to clear
- Min chars hint when < 3 characters typed

- [ ] **Step 2: Create invite page**

Create `src/app/[locale]/(dashboard)/org/members/invite/page.tsx`:
- Admin role guard
- `UserSearch` for selecting a user
- Role select: radio group or Select with admin/editor/viewer (default viewer)
- Submit button → `organizationsApi.inviteMember(token, orgId, { user_id, role })`
- Success → toast + redirect to members page
- 409 → toast "already a member"

- [ ] **Step 3: Verify**

Navigate to `/ru/org/members/invite` — should show search + role select + submit.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/(dashboard)/org/members/invite/page.tsx src/components/org/user-search.tsx
git commit -m "feat(slice-d): add invite member page with user search"
```

---

### Task 17: Org Settings Page

**Files:**
- Create: `src/app/[locale]/(dashboard)/org/settings/page.tsx`

- [ ] **Step 1: Create org settings page**

Create `src/app/[locale]/(dashboard)/org/settings/page.tsx`:
- Admin role guard
- Two stacked cards:

**Card 1: Organization Profile**
- `AvatarUpload` for org photo — same upload flow as avatar-section.tsx, but on ready calls `organizationsApi.updatePhoto(token, orgId, { photo_id })` and refetches org data
- Read-only definition list below: full name, short name, INN, legal address, manager, registration date, status badge
- Data from `useOrgStore.currentOrg`

**Card 2: Contacts**
- `useForm` with `zodResolver(contactsReplaceSchema)`, `defaultValues` from `currentOrg.contacts`
- `ContactsEditor` component (reused from org creation)
- Save button → `organizationsApi.replaceContacts(token, orgId, { contacts })` → toast → refetch org

- [ ] **Step 2: Verify**

Navigate to `/ru/org/settings` — should show org profile and contacts editor.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(dashboard)/org/settings/page.tsx
git commit -m "feat(slice-d): add org settings page"
```

---

### Task 18: Final Integration & Polish

**Files:**
- Modify: `src/docs/slices.md` (update status)
- Various files for fixes

- [ ] **Step 1: Smoke test all pages**

Run dev server and manually verify each page:
1. `/ru/organizations/new` — Dadata search, contacts, submit
2. User menu → "Join organization" — dialog opens, search works
3. `/ru/org/listings` — table renders, filters work, status change works
4. `/ru/org/listings/new` — form renders, photo upload, submit creates listing
5. `/ru/org/listings/[id]/edit` — pre-filled form, save, delete, status change
6. `/ru/org/members` — tabs render, actions work
7. `/ru/org/members/invite` — search, role select, submit
8. `/ru/org/settings` — photo upload, contacts save
9. Org switcher — appears if user has multiple orgs

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Update slices.md**

In `docs/slices.md`, change Slice D status from "Not started" to "Complete".

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat(slice-d): complete org dashboard implementation"
```
