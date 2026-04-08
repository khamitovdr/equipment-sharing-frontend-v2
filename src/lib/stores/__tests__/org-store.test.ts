import { describe, it, expect, beforeEach } from "vitest";
import { useOrgStore } from "../org-store";
import type { OrganizationRead } from "@/types/organization";

const makeOrg = (overrides: Partial<OrganizationRead> = {}): OrganizationRead => ({
  id: "org1",
  inn: "1234567890",
  short_name: "Test Org",
  full_name: "Test Organization LLC",
  registration_date: null,
  authorized_capital_k_rubles: null,
  legal_address: null,
  manager_name: null,
  main_activity: null,
  status: "verified",
  contacts: [],
  photo: null,
  ...overrides,
});

describe("orgStore", () => {
  beforeEach(() => {
    useOrgStore.setState({
      currentOrg: null,
      currentRole: null,
      organizations: [],
    });
  });

  it("starts with null currentOrg, null currentRole, empty organizations", () => {
    const state = useOrgStore.getState();
    expect(state.currentOrg).toBeNull();
    expect(state.currentRole).toBeNull();
    expect(state.organizations).toEqual([]);
  });

  it("setOrganizations stores orgs", () => {
    const orgs = [
      makeOrg({ id: "org1" }),
      makeOrg({ id: "org2", short_name: "Org 2" }),
    ];
    useOrgStore.getState().setOrganizations(orgs);
    expect(useOrgStore.getState().organizations).toEqual(orgs);
  });

  it("switchOrg selects the correct org by id", () => {
    const org1 = makeOrg({ id: "org1" });
    const org2 = makeOrg({ id: "org2", short_name: "Org 2" });
    useOrgStore.getState().setOrganizations([org1, org2]);

    useOrgStore.getState().switchOrg("org2");

    expect(useOrgStore.getState().currentOrg).toEqual(org2);
  });

  it("switchOrg sets currentOrg to null when id not found", () => {
    useOrgStore.getState().setOrganizations([makeOrg({ id: "org1" })]);

    useOrgStore.getState().switchOrg("nonexistent");

    expect(useOrgStore.getState().currentOrg).toBeNull();
  });

  it("setCurrentOrg stores the organization", () => {
    const org = makeOrg({ id: "org1" });
    useOrgStore.getState().setCurrentOrg(org);
    expect(useOrgStore.getState().currentOrg).toEqual(org);
  });

  it("setCurrentRole stores the role", () => {
    useOrgStore.getState().setCurrentRole("editor");
    expect(useOrgStore.getState().currentRole).toBe("editor");
  });

  it("clearOrgContext resets all fields", () => {
    useOrgStore.getState().setCurrentOrg(makeOrg());
    useOrgStore.getState().setCurrentRole("admin");
    useOrgStore.getState().setOrganizations([makeOrg()]);

    useOrgStore.getState().clearOrgContext();

    const state = useOrgStore.getState();
    expect(state.currentOrg).toBeNull();
    expect(state.currentRole).toBeNull();
    expect(state.organizations).toEqual([]);
  });
});
