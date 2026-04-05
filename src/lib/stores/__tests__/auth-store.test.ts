import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../auth-store";

vi.mock("@/lib/api/users", () => ({
  usersApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
  },
}));

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  it("starts with no user and no token", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("sets user and token on setAuth", () => {
    const mockUser = {
      id: "1",
      email: "test@test.com",
      phone: "+79991234567",
      name: "Test",
      middle_name: null,
      surname: "User",
      role: "user" as const,
      created_at: "2026-01-01T00:00:00Z",
      profile_photo: null,
    };

    useAuthStore.getState().setAuth(mockUser, "test-token");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe("test-token");
    expect(state.isAuthenticated).toBe(true);
  });

  it("clears state on logout", () => {
    useAuthStore.getState().setAuth(
      {
        id: "1",
        email: "test@test.com",
        phone: "+79991234567",
        name: "Test",
        middle_name: null,
        surname: "User",
        role: "user",
        created_at: "2026-01-01T00:00:00Z",
        profile_photo: null,
      },
      "token"
    );

    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
