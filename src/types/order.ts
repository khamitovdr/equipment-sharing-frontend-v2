export type OrderStatus =
  | "pending"
  | "offered"
  | "accepted"
  | "confirmed"
  | "active"
  | "finished"
  | "canceled_by_user"
  | "canceled_by_organization"
  | "expired";

export interface OrderRead {
  id: string;
  listing_id: string;
  organization_id: string;
  requester_id: string;
  requested_start_date: string;
  requested_end_date: string;
  status: OrderStatus;
  estimated_cost: string | null;
  offered_cost: string | null;
  offered_start_date: string | null;
  offered_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderCreate {
  listing_id: string;
  requested_start_date: string;
  requested_end_date: string;
}

export interface OrderOffer {
  offered_cost: string;
  offered_start_date: string;
  offered_end_date: string;
}

export interface OrderListParams {
  cursor?: string | null;
  limit?: number;
  status?: OrderStatus;
  listing_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}
