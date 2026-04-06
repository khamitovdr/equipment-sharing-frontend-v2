"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usersApi } from "@/lib/api/users";
import type { LoginRequest, UserCreate } from "@/types/user";

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const login = useCallback(
    async (data: LoginRequest) => {
      const { access_token } = await usersApi.login(data);
      const me = await usersApi.me(access_token);
      setAuth(me, access_token);
      return me;
    },
    [setAuth]
  );

  const register = useCallback(
    async (data: UserCreate) => {
      const { access_token } = await usersApi.register(data);
      const me = await usersApi.me(access_token);
      setAuth(me, access_token);
      return { user: me, access_token };
    },
    [setAuth]
  );

  const logout = useCallback(() => {
    clearAuth();
    router.push("/");
  }, [clearAuth, router]);

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
