import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrganizationRead, MembershipRead } from "@/types/organization";

interface OrgState {
  currentOrg: OrganizationRead | null;
  membership: MembershipRead | null;
  organizations: MembershipRead[];
  switchOrg: (orgId: string) => void;
  setCurrentOrg: (org: OrganizationRead) => void;
  setOrganizations: (memberships: MembershipRead[]) => void;
  clearOrgContext: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      currentOrg: null,
      membership: null,
      organizations: [],

      switchOrg: (orgId: string) => {
        const membership =
          get().organizations.find((m) => m.organization_id === orgId) ?? null;
        set({ membership });
      },

      setCurrentOrg: (org: OrganizationRead) => set({ currentOrg: org }),

      setOrganizations: (memberships: MembershipRead[]) =>
        set({ organizations: memberships }),

      clearOrgContext: () =>
        set({ currentOrg: null, membership: null, organizations: [] }),
    }),
    {
      name: "equip-me-org",
      partialize: (state) => ({
        membership: state.membership,
        organizations: state.organizations,
      }),
    }
  )
);
