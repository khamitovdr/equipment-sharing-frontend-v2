import { apiClient } from "./client";
import type { UserRead, UserCreate, UserUpdate, LoginRequest, TokenResponse } from "@/types/user";

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
};
