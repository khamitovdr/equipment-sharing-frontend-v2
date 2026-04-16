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
  order_by?: string | null;
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

  listMembers(token: string, orgId: string, params?: { cursor?: string | null; limit?: number; order_by?: string | null }) {
    return apiClient<PaginatedResponse<MembershipRead>>(
      `/organizations/${orgId}/members/`,
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
    return apiClient<MembershipRead>(`/organizations/${orgId}/members/${memberId}/approve`, {
      method: "PATCH",
      body: data,
      token,
    });
  },

  updateMemberRole(token: string, orgId: string, memberId: string, data: MembershipRoleUpdate) {
    return apiClient<MembershipRead>(`/organizations/${orgId}/members/${memberId}/role`, {
      method: "PATCH",
      body: data,
      token,
    });
  },

  removeMember(token: string, orgId: string, memberId: string) {
    return apiClient<void>(`/organizations/${orgId}/members/${memberId}`, {
      method: "DELETE",
      token,
    });
  },

  availableCategories(token: string, orgId: string) {
    return apiClient<ListingCategoryRead[]>(
      `/organizations/${orgId}/listings/categories/available/`,
      { token }
    );
  },
};
