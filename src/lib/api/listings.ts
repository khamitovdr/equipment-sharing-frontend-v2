import { apiClient } from "./client";
import type {
  ListingRead,
  ListingCategoryRead,
  ListingsQueryParams,
  ReservationRead,
  ListingCreate,
  ListingUpdate,
  ListingStatusUpdate,
  ListingCategoryCreate,
  OrgListingsQueryParams,
} from "@/types/listing";
import type { PaginatedResponse } from "@/types/api";

export const listingsApi = {
  list(params?: ListingsQueryParams, token?: string | null) {
    return apiClient<PaginatedResponse<ListingRead>>("/listings/", {
      params: params as Record<string, string | string[] | number | boolean | null | undefined>,
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

  orgList(token: string, orgId: string, params?: OrgListingsQueryParams) {
    return apiClient<PaginatedResponse<ListingRead>>(
      `/organizations/${orgId}/listings/`,
      {
        params: params as Record<string, string | number | boolean | null | undefined>,
        token,
      }
    );
  },

  orgGet(token: string, orgId: string, listingId: string) {
    return apiClient<ListingRead>(`/organizations/${orgId}/listings/${listingId}`, {
      token,
    });
  },

  orgCreate(token: string, orgId: string, data: ListingCreate) {
    return apiClient<ListingRead>(`/organizations/${orgId}/listings/`, {
      method: "POST",
      body: data,
      token,
    });
  },

  orgUpdate(token: string, orgId: string, listingId: string, data: ListingUpdate) {
    return apiClient<ListingRead>(`/organizations/${orgId}/listings/${listingId}`, {
      method: "PATCH",
      body: data,
      token,
    });
  },

  orgDelete(token: string, orgId: string, listingId: string) {
    return apiClient<void>(`/organizations/${orgId}/listings/${listingId}`, {
      method: "DELETE",
      token,
    });
  },

  orgUpdateStatus(token: string, orgId: string, listingId: string, data: ListingStatusUpdate) {
    return apiClient<ListingRead>(`/organizations/${orgId}/listings/${listingId}/status`, {
      method: "PATCH",
      body: data,
      token,
    });
  },

  orgCreateCategory(token: string, orgId: string, data: ListingCategoryCreate) {
    return apiClient<ListingCategoryRead>(`/organizations/${orgId}/listings/categories/`, {
      method: "POST",
      body: data,
      token,
    });
  },
};
