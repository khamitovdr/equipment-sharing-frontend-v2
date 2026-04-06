import { apiClient } from "./client";
import type { OrderRead, OrderCreate } from "@/types/order";

export const ordersApi = {
  create(token: string, data: OrderCreate) {
    return apiClient<OrderRead>("/orders/", {
      method: "POST",
      body: data,
      token,
    });
  },
};
