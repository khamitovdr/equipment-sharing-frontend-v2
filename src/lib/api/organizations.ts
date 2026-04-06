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
