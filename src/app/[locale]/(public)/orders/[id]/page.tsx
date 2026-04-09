"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BackButton } from "@/components/shared/back-button";
import { toast } from "sonner";

import { ordersApi } from "@/lib/api/orders";
import { listingsApi } from "@/lib/api/listings";
import { organizationsApi } from "@/lib/api/organizations";
import { useAuthStore } from "@/lib/stores/auth-store";
import { OrderStatusStepper } from "@/components/order/order-status-stepper";
import { OrderActionsBar } from "@/components/order/order-actions-bar";
import { OfferDetails } from "@/components/order/offer-details";
import { ChatPanel } from "@/components/chat/chat-panel";
import { MobileChatButton } from "@/components/chat/mobile-chat-button";
import { EquipmentPlaceholder } from "@/components/shared/equipment-placeholder";
import { OrgPlaceholder } from "@/components/shared/org-placeholder";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/lib/api/client";
import { formatCost, formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id: orderId } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ["chat-status", orderId] });
    };
  }, [queryClient, orderId]);

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

  const { data: organization } = useQuery({
    queryKey: ["organization", order?.organization_id],
    queryFn: () => organizationsApi.get(order!.organization_id),
    enabled: !!order?.organization_id,
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
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isPending = acceptMutation.isPending || cancelMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-start gap-16 mb-6">
        <div className="shrink-0 -mt-0.5">
          <BackButton />
        </div>
        <OrderStatusStepper status={order.status} />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column — order info */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* Actions + offer — mobile: top, desktop: bottom */}
          <div className="lg:hidden">
            <OrderActionsBar
              order={order}
              side="renter"
              onAccept={() => acceptMutation.mutate()}
              onCancel={() => cancelMutation.mutate()}
              isPending={isPending}
            />
          </div>

          <div className="lg:hidden">
            <OfferDetails order={order} />
          </div>

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

            {organization && (
              <Link
                href={`/${locale}/organizations/${organization.id}`}
                className="flex items-center gap-2.5 pt-3 border-t hover:opacity-80 transition-opacity"
              >
                {organization.photo?.small_url ? (
                  <img
                    src={organization.photo.small_url}
                    alt={organization.short_name ?? organization.full_name ?? ""}
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <OrgPlaceholder className="size-8" />
                )}
                <span className="text-sm font-medium">
                  {organization.short_name ?? organization.full_name ?? organization.inn}
                </span>
              </Link>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t">
              <div>
                <p className="text-xs text-zinc-400">{t("orders.detail.requestedDates")}</p>
                <p className="font-medium">{formatDate(order.requested_start_date, locale)} — {formatDate(order.requested_end_date, locale)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">{t("orders.detail.estimatedCost")}</p>
                <p className="font-medium">
                  {order.estimated_cost ? `${formatCost(order.estimated_cost)} ₽` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">{t("orders.detail.orderId")}</p>
                <p className="font-mono text-xs text-zinc-500">#{order.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">{t("orders.detail.created")}</p>
                <p className="text-zinc-600">{formatDate(order.created_at, locale)}</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <OfferDetails order={order} />
          </div>

          <div className="hidden lg:block">
            <OrderActionsBar
              order={order}
              side="renter"
              onAccept={() => acceptMutation.mutate()}
              onCancel={() => cancelMutation.mutate()}
              isPending={isPending}
            />
          </div>
        </div>

        {/* Right column — chat */}
        <div className="hidden lg:block w-full lg:w-1/2 shrink-0">
          <ChatPanel orderId={orderId} side="requester" translationPrefix="orders" className="lg:h-[calc(100vh-12rem)] lg:top-[4.5rem]" />
        </div>
      </div>
      <MobileChatButton orderId={orderId} side="requester" translationPrefix="orders" />
    </div>
  );
}
