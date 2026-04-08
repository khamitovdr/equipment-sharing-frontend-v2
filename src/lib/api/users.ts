import { apiClient } from "./client";
import type { UserRead, UserCreate, UserUpdate, LoginRequest, TokenResponse } from "@/types/user";
import type { OrganizationRead } from "@/types/organization";
import type { PaginatedResponse } from "@/types/api";

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

  getById(userId: string) {
    return apiClient<UserRead>(`/users/${userId}`);
  },

  myOrganizations(token: string) {
    return apiClient<PaginatedResponse<OrganizationRead>>("/users/me/organizations", { token });
  },

  search(token: string, params: { email: string; limit?: number }) {
    return apiClient<UserRead[]>("/users/search", {
      token,
      params: params as Record<string, string | number | boolean | null | undefined>,
    });
  },
};
