import { describe, it, expect, beforeEach } from "vitest";
import { useOrgStore } from "../org-store";
import type { MembershipRead, OrganizationRead } from "@/types/organization";

const makeMembership = (overrides: Partial<MembershipRead> = {}): MembershipRead => ({
  id: "m1",
  user_id: "u1",
  organization_id: "org1",
  role: "admin",
  status: "member",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

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
      membership: null,
      organizations: [],
    });
  });

  it("starts with null currentOrg, null membership, empty organizations", () => {
    const state = useOrgStore.getState();
    expect(state.currentOrg).toBeNull();
    expect(state.membership).toBeNull();
    expect(state.organizations).toEqual([]);
  });

  it("setOrganizations stores memberships", () => {
    const memberships = [
      makeMembership({ id: "m1", organization_id: "org1" }),
      makeMembership({ id: "m2", organization_id: "org2" }),
    ];

    useOrgStore.getState().setOrganizations(memberships);

    expect(useOrgStore.getState().organizations).toEqual(memberships);
  });

  it("switchOrg selects the correct membership by orgId", () => {
    const m1 = makeMembership({ id: "m1", organization_id: "org1" });
    const m2 = makeMembership({ id: "m2", organization_id: "org2" });
    useOrgStore.getState().setOrganizations([m1, m2]);

    useOrgStore.getState().switchOrg("org2");

    expect(useOrgStore.getState().membership).toEqual(m2);
  });

  it("switchOrg sets membership to null when orgId not found", () => {
    const m1 = makeMembership({ id: "m1", organization_id: "org1" });
    useOrgStore.getState().setOrganizations([m1]);

    useOrgStore.getState().switchOrg("nonexistent");

    expect(useOrgStore.getState().membership).toBeNull();
  });

  it("setCurrentOrg stores the organization", () => {
    const org = makeOrg({ id: "org1" });
    useOrgStore.getState().setCurrentOrg(org);

    expect(useOrgStore.getState().currentOrg).toEqual(org);
  });

  it("clearOrgContext resets all fields", () => {
    const org = makeOrg();
    const membership = makeMembership();
    useOrgStore.getState().setCurrentOrg(org);
    useOrgStore.getState().setOrganizations([membership]);
    useOrgStore.getState().switchOrg("org1");

    useOrgStore.getState().clearOrgContext();

    const state = useOrgStore.getState();
    expect(state.currentOrg).toBeNull();
    expect(state.membership).toBeNull();
    expect(state.organizations).toEqual([]);
  });
});
