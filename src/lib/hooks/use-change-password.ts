"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { UserRead, UserUpdate } from "@/types/user";

export function useChangePassword() {
  const token = useAuthStore((s) => s.token);

  return useMutation({
    mutationFn: (data: { password: string; new_password: string }) => {
      if (!token) throw new Error("Not authenticated");
      return apiClient<UserRead>("/users/me", {
        method: "PATCH",
        body: data,
        token,
        skipAuthRedirect: true,
      });
    },
  });
}
