"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgStore } from "@/lib/stores/org-store";
import { usersApi } from "@/lib/api/users";
import { organizationsApi } from "@/lib/api/organizations";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useOrg() {
  const queryClient = useQueryClient();
  const { currentOrg, membership, organizations, clearOrgContext } =
    useOrgStore();
  const { switchOrg: storeSwitchOrg, setCurrentOrg, setOrganizations } =
    useOrgStore.getState();
  const token = useAuthStore((s) => s.token);

  const fetchOrganizations = useCallback(async () => {
    if (!token) return;
    const memberships = await usersApi.myOrganizations(token);
    setOrganizations(memberships);
    return memberships;
  }, [token, setOrganizations]);

  const fetchCurrentOrg = useCallback(
    async (orgId: string) => {
      const org = await organizationsApi.get(orgId);
      setCurrentOrg(org);
      return org;
    },
    [setCurrentOrg]
  );

  const switchOrg = useCallback(
    async (orgId: string) => {
      storeSwitchOrg(orgId);
      await fetchCurrentOrg(orgId);
      queryClient.invalidateQueries({ queryKey: ["org-listings"] });
      queryClient.invalidateQueries({ queryKey: ["org-listing-categories"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    [storeSwitchOrg, fetchCurrentOrg, queryClient]
  );

  return {
    currentOrg,
    membership,
    organizations,
    clearOrgContext,
    fetchOrganizations,
    fetchCurrentOrg,
    switchOrg,
  };
}
