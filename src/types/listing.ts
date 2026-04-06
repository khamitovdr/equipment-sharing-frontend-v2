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
  category_id?: string | string[] | null;
  organization_id?: string | null;
}
