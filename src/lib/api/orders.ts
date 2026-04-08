import { apiClient } from "./client";
import type { OrderRead, OrderCreate, OrderOffer, OrderListParams } from "@/types/order";
import type { PaginatedResponse } from "@/types/api";

export const ordersApi = {
  create(token: string, data: OrderCreate) {
    return apiClient<OrderRead>("/orders/", {
      method: "POST",
      body: data,
      token,
    });
  },

  list(token: string, params?: OrderListParams) {
    return apiClient<PaginatedResponse<OrderRead>>("/orders/", {
      params: params as Record<string, string | number | boolean | null | undefined>,
      token,
    });
  },

  get(token: string, orderId: string) {
    return apiClient<OrderRead>(`/orders/${orderId}`, { token });
  },

  accept(token: string, orderId: string) {
    return apiClient<OrderRead>(`/orders/${orderId}/accept`, {
      method: "PATCH",
      token,
    });
  },

  cancel(token: string, orderId: string) {
    return apiClient<OrderRead>(`/orders/${orderId}/cancel`, {
      method: "PATCH",
      token,
    });
  },

  orgList(token: string, orgId: string, params?: OrderListParams) {
    return apiClient<PaginatedResponse<OrderRead>>(
      `/organizations/${orgId}/orders/`,
      {
        params: params as Record<string, string | number | boolean | null | undefined>,
        token,
      }
    );
  },

  orgGet(token: string, orgId: string, orderId: string) {
    return apiClient<OrderRead>(`/organizations/${orgId}/orders/${orderId}`, {
      token,
    });
  },

  orgOffer(token: string, orgId: string, orderId: string, data: OrderOffer) {
    return apiClient<OrderRead>(
      `/organizations/${orgId}/orders/${orderId}/offer`,
      {
        method: "PATCH",
        body: data,
        token,
      }
    );
  },

  orgApprove(token: string, orgId: string, orderId: string) {
    return apiClient<OrderRead>(
      `/organizations/${orgId}/orders/${orderId}/approve`,
      {
        method: "PATCH",
        token,
      }
    );
  },

  orgCancel(token: string, orgId: string, orderId: string) {
    return apiClient<OrderRead>(
      `/organizations/${orgId}/orders/${orderId}/cancel`,
      {
        method: "PATCH",
        token,
      }
    );
  },
};
