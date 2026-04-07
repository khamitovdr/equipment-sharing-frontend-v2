"use client";

import { useMutation } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { UserUpdate } from "@/types/user";

export function useUpdateProfile() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (data: UserUpdate) => {
      if (!token) throw new Error("Not authenticated");
      return usersApi.update(token, data);
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
    },
  });
}
