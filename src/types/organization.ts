import type { ProfilePhotoRead } from "./user";

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
