"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgStore } from "@/lib/stores/org-store";
import { usersApi } from "@/lib/api/users";
import { organizationsApi } from "@/lib/api/organizations";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { OrganizationRead } from "@/types/organization";

export function useOrg() {
  const queryClient = useQueryClient();
  const { currentOrg, currentRole, organizations, clearOrgContext } =
    useOrgStore();
  const {
    switchOrg: storeSwitchOrg,
    setCurrentOrg,
    setCurrentRole,
    setOrganizations,
  } = useOrgStore.getState();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchOrganizations = useCallback(async (): Promise<OrganizationRead[]> => {
    if (!token) return [];
    const res = await usersApi.myOrganizations(token);
    const orgs = res.items;
    setOrganizations(orgs);
    return orgs;
  }, [token, setOrganizations]);

  const fetchCurrentOrg = useCallback(
    async (orgId: string) => {
      const org = await organizationsApi.get(orgId);
      setCurrentOrg(org);
      return org;
    },
    [setCurrentOrg]
  );

  const fetchCurrentRole = useCallback(
    async (orgId: string) => {
      if (!token || !userId) return null;
      const res = await organizationsApi.listMembers(token, orgId, { limit: 50 });
      const myMembership = res.items.find((m) => m.user_id === userId);
      if (myMembership) {
        setCurrentRole(myMembership.role);
        return myMembership.role;
      }
      return null;
    },
    [token, userId, setCurrentRole]
  );

  const switchOrg = useCallback(
    async (orgId: string) => {
      storeSwitchOrg(orgId);
      await Promise.all([
        fetchCurrentOrg(orgId),
        fetchCurrentRole(orgId),
      ]);
      queryClient.invalidateQueries({ queryKey: ["org-listings"] });
      queryClient.invalidateQueries({ queryKey: ["org-listing-categories"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    [storeSwitchOrg, fetchCurrentOrg, fetchCurrentRole, queryClient]
  );

  return {
    currentOrg,
    currentRole,
    organizations,
    clearOrgContext,
    fetchOrganizations,
    fetchCurrentOrg,
    fetchCurrentRole,
    switchOrg,
  };
}
