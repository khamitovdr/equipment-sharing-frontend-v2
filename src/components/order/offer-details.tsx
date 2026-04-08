"use client";

import { useTranslations } from "next-intl";
import { formatCost } from "@/lib/utils";
import type { OrderRead } from "@/types/order";

interface OfferDetailsProps {
  order: OrderRead;
}

export function OfferDetails({ order }: OfferDetailsProps) {
  const t = useTranslations("orders.detail");

  if (!order.offered_cost && !order.offered_start_date) return null;

  const costChanged = order.offered_cost !== order.estimated_cost;
  const datesChanged =
    order.offered_start_date !== order.requested_start_date ||
    order.offered_end_date !== order.requested_end_date;

  return (
    <div className="rounded-lg border bg-blue-50/50 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        {/* Requested */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase">{t("requested")}</p>
          <div>
            <p className="text-xs text-zinc-400">{t("requestedDates")}</p>
            <p>{order.requested_start_date} — {order.requested_end_date}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{t("estimatedCost")}</p>
            <p>{order.estimated_cost ? `${formatCost(order.estimated_cost)} ₽` : "—"}</p>
          </div>
        </div>

        {/* Offered */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-blue-600 uppercase">{t("offered")}</p>
          <div>
            <p className="text-xs text-zinc-400">{t("offeredDates")}</p>
            <p className={datesChanged ? "font-semibold text-blue-700" : ""}>
              {order.offered_start_date} — {order.offered_end_date}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{t("offeredCost")}</p>
            <p className={costChanged ? "font-semibold text-blue-700" : ""}>
              {order.offered_cost ? `${formatCost(order.offered_cost)} ₽` : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
