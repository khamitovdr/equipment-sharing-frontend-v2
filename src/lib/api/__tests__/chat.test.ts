import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../client", () => ({
  apiClient: vi.fn(),
}));

import { chatApi } from "../chat";
import { apiClient } from "../client";

const mockApiClient = vi.mocked(apiClient);

describe("chatApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMessages", () => {
    it("calls correct requester endpoint with params", async () => {
      mockApiClient.mockResolvedValue({ items: [], next_cursor: null, has_more: false });
      await chatApi.getMessages("tok", "order-1", { cursor: "abc", limit: 20 });
      expect(mockApiClient).toHaveBeenCalledWith("/orders/order-1/chat/messages", {
        params: { cursor: "abc", limit: 20 },
        token: "tok",
      });
    });
  });

  describe("getStatus", () => {
    it("calls correct requester endpoint", async () => {
      mockApiClient.mockResolvedValue({ status: "active", unread_count: 0 });
      await chatApi.getStatus("tok", "order-1");
      expect(mockApiClient).toHaveBeenCalledWith("/orders/order-1/chat/status", {
        token: "tok",
      });
    });
  });

  describe("orgGetMessages", () => {
    it("calls correct org endpoint with params", async () => {
      mockApiClient.mockResolvedValue({ items: [], next_cursor: null, has_more: false });
      await chatApi.orgGetMessages("tok", "org-1", "order-1", { cursor: "abc", limit: 20 });
      expect(mockApiClient).toHaveBeenCalledWith(
        "/organizations/org-1/orders/order-1/chat/messages",
        { params: { cursor: "abc", limit: 20 }, token: "tok" }
      );
    });
  });

  describe("orgGetStatus", () => {
    it("calls correct org endpoint", async () => {
      mockApiClient.mockResolvedValue({ status: "active", unread_count: 3 });
      await chatApi.orgGetStatus("tok", "org-1", "order-1");
      expect(mockApiClient).toHaveBeenCalledWith(
        "/organizations/org-1/orders/order-1/chat/status",
        { token: "tok" }
      );
    });
  });
});
