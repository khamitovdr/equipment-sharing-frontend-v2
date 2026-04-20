"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { usersApi } from "@/lib/api/users";
import type { LoginRequest, UserCreate } from "@/types/user";

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const login = useCallback(
    async (data: LoginRequest) => {
      queryClient.clear();
      const { access_token } = await usersApi.login(data);
      const me = await usersApi.me(access_token);
      setAuth(me, access_token);
      return me;
    },
    [setAuth, queryClient]
  );

  const register = useCallback(
    async (data: UserCreate) => {
      queryClient.clear();
      const { access_token } = await usersApi.register(data);
      const me = await usersApi.me(access_token);
      setAuth(me, access_token);
      return { user: me, access_token };
    },
    [setAuth, queryClient]
  );

  const logout = useCallback(() => {
    queryClient.clear();
    clearAuth();
    useOrgStore.getState().clearOrgContext();
    router.push("/");
  }, [clearAuth, router, queryClient]);

  const hydrate = useCallback(async () => {
    if (!token) return;
    try {
      const me = await usersApi.me(token);
      setAuth(me, token);
    } catch {
      clearAuth();
    }
  }, [token, setAuth, clearAuth]);

  return { user, token, isAuthenticated, login, register, logout, hydrate };
}
