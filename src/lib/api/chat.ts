import { apiClient } from "./client";
import type { ChatMessagesResponse, ChatStatusResponse } from "@/types/chat";

interface ChatMessagesParams {
  cursor?: string | null;
  limit?: number;
}

export const chatApi = {
  getMessages(token: string, orderId: string, params?: ChatMessagesParams) {
    return apiClient<ChatMessagesResponse>(`/orders/${orderId}/chat/messages`, {
      params: params as Record<string, string | number | boolean | null | undefined>,
      token,
    });
  },

  getStatus(token: string, orderId: string) {
    return apiClient<ChatStatusResponse>(`/orders/${orderId}/chat/status`, {
      token,
    });
  },

  orgGetMessages(token: string, orgId: string, orderId: string, params?: ChatMessagesParams) {
    return apiClient<ChatMessagesResponse>(
      `/organizations/${orgId}/orders/${orderId}/chat/messages`,
      {
        params: params as Record<string, string | number | boolean | null | undefined>,
        token,
      }
    );
  },

  orgGetStatus(token: string, orgId: string, orderId: string) {
    return apiClient<ChatStatusResponse>(
      `/organizations/${orgId}/orders/${orderId}/chat/status`,
      { token }
    );
  },
};
