"use client";

import { use } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { ordersApi } from "@/lib/api/orders";
import { listingsApi } from "@/lib/api/listings";
import { useAuthStore } from "@/lib/stores/auth-store";
import { OrderStatusStepper } from "@/components/order/order-status-stepper";
import { OrderActionsBar } from "@/components/order/order-actions-bar";
import { OfferDetails } from "@/components/order/offer-details";
import { ChatPlaceholder } from "@/components/order/chat-placeholder";
import { EquipmentPlaceholder } from "@/components/shared/equipment-placeholder";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/lib/api/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id: orderId } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => ordersApi.get(token!, orderId),
    enabled: !!token,
  });

  const { data: listing } = useQuery({
    queryKey: ["listing", order?.listing_id],
    queryFn: () => listingsApi.get(order!.listing_id),
    enabled: !!order?.listing_id,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const acceptMutation = useMutation({
    mutationFn: () => ordersApi.accept(token!, orderId),
    onSuccess: () => {
      toast.success(t("orders.accepted"));
      invalidate();
    },
    onError: (e) => {
      toast.error(e instanceof ApiRequestError ? String(e.detail) : t("common.error"));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(token!, orderId),
    onSuccess: () => {
      toast.success(t("orders.canceled"));
      invalidate();
    },
    onError: () => toast.error(t("common.error")),
  });

  if (isLoading || !order) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isPending = acceptMutation.isPending || cancelMutation.isPending;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Link
        href={`/${locale}/orders`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black mb-6"
      >
        <ArrowLeft className="size-4" />
        {t("orders.detail.backToOrders")}
      </Link>

      <OrderStatusStepper status={order.status} />

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Left column — order info */}
        <div className="flex-1 space-y-6 min-w-0">

          <OrderActionsBar
            order={order}
            side="renter"
            onAccept={() => acceptMutation.mutate()}
            onCancel={() => cancelMutation.mutate()}
            isPending={isPending}
          />

          <OfferDetails order={order} />

          {/* Order info card */}
          <div className="rounded-lg border p-5 space-y-4">
            {listing && (
              <Link
                href={`/${locale}/listings/${listing.id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                {listing.photos[0]?.small_url ? (
                  <img
                    src={listing.photos[0].small_url}
                    alt={listing.name}
                    className="size-12 rounded-lg object-cover"
                  />
                ) : (
                  <EquipmentPlaceholder className="size-12 rounded-lg" />
                )}
                <div>
                  <p className="font-semibold">{listing.name}</p>
                  <p className="text-sm text-zinc-500">{listing.category.name}</p>
                </div>
              </Link>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
              <div>
                <p className="text-xs text-zinc-400">{t("orders.detail.requestedDates")}</p>
                <p className="font-medium">{order.requested_start_date} — {order.requested_end_date}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">{t("orders.detail.estimatedCost")}</p>
                <p className="font-medium">
                  {order.estimated_cost ? `${Number(order.estimated_cost).toLocaleString()} ₽` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">{t("orders.detail.orderId")}</p>
                <p className="font-mono text-xs text-zinc-500">#{order.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">{t("orders.detail.created")}</p>
                <p className="text-zinc-600">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — chat placeholder */}
        <div className="w-full lg:w-1/2 shrink-0">
          <ChatPlaceholder translationPrefix="orders" />
        </div>
      </div>
    </div>
  );
}
