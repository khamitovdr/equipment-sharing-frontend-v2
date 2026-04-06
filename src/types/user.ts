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
