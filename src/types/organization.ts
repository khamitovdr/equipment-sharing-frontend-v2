import type { ProfilePhotoRead } from "./user";

export type OrganizationStatus = "created" | "verified";

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
