"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/order";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  offered: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-indigo-100 text-indigo-800 border-indigo-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  active: "bg-green-100 text-green-800 border-green-200",
  finished: "bg-zinc-100 text-zinc-600 border-zinc-200",
  canceled_by_user: "bg-red-100 text-red-800 border-red-200",
  canceled_by_organization: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const t = useTranslations("orders.status");

  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {t(status)}
    </Badge>
  );
}
