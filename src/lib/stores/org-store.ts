import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrganizationRead, MembershipRole } from "@/types/organization";

interface OrgState {
  currentOrg: OrganizationRead | null;
  currentRole: MembershipRole | null;
  organizations: OrganizationRead[];
  switchOrg: (orgId: string) => void;
  setCurrentOrg: (org: OrganizationRead) => void;
  setCurrentRole: (role: MembershipRole) => void;
  setOrganizations: (orgs: OrganizationRead[]) => void;
  clearOrgContext: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      currentOrg: null,
      currentRole: null,
      organizations: [],

      switchOrg: (orgId: string) => {
        const org =
          get().organizations.find((o) => o.id === orgId) ?? null;
        set({ currentOrg: org, currentRole: null });
      },

      setCurrentOrg: (org: OrganizationRead) => set({ currentOrg: org }),

      setCurrentRole: (role: MembershipRole) => set({ currentRole: role }),

      setOrganizations: (orgs: OrganizationRead[]) =>
        set({ organizations: orgs }),

      clearOrgContext: () =>
        set({ currentOrg: null, currentRole: null, organizations: [] }),
    }),
    {
      name: "equip-me-org",
      partialize: (state) => ({
        currentOrg: state.currentOrg,
        currentRole: state.currentRole,
        organizations: state.organizations,
      }),
    }
  )
);
