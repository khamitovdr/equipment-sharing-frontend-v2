import { apiClient } from "./client";
import type { ListingRead, ListingCategoryRead, ListingsQueryParams, ReservationRead } from "@/types/listing";
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
};
