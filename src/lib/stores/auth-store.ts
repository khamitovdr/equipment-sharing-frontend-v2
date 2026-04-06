import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRead } from "@/types/user";

interface AuthState {
  user: UserRead | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserRead, token: string) => void;
  clearAuth: () => void;
  setUser: (user: UserRead) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      setUser: (user) => set({ user }),
    }),
    {
      name: "equip-me-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
