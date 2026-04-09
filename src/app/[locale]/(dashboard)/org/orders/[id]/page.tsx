"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BackButton } from "@/components/shared/back-button";
import { toast } from "sonner";

import { ordersApi } from "@/lib/api/orders";
import { listingsApi } from "@/lib/api/listings";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { OrderStatusStepper } from "@/components/order/order-status-stepper";
import { OrderActionsBar } from "@/components/order/order-actions-bar";
import { OfferDetails } from "@/components/order/offer-details";
import { ChatPanel } from "@/components/chat/chat-panel";
import { MobileChatButton } from "@/components/chat/mobile-chat-button";
import { EquipmentPlaceholder } from "@/components/shared/equipment-placeholder";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/lib/api/client";
import { formatCost, formatDate } from "@/lib/utils";
import type { OrderOfferFormData } from "@/lib/validators/order";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrgOrderDetailPage({ params }: PageProps) {
  const { id: orderId } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const token = useAuthStore((s) => s.token);
  const orgId = useOrgStore((s) => s.currentOrg?.id) ?? "";
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ["chat-status", orderId] });
    };
  }, [queryClient, orderId]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["org-order", orgId, orderId],
    queryFn: () => ordersApi.orgGet(token!, orgId, orderId),
    enabled: !!token && !!orgId,
  });

  const { data: listing } = useQuery({
    queryKey: ["listing", order?.listing_id],
    queryFn: () => listingsApi.get(order!.listing_id),
    enabled: !!order?.listing_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: requester } = useQuery({
    queryKey: ["user", order?.requester_id],
    queryFn: () => usersApi.getById(order!.requester_id),
    enabled: !!order?.requester_id,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["org-order", orgId, orderId] });
    queryClient.invalidateQueries({ queryKey: ["org-orders", orgId] });
    if (order?.listing_id) {
      queryClient.invalidateQueries({ queryKey: ["reservations", order.listing_id] });
    }
  };

  const offerMutation = useMutation({
    mutationFn: (data: OrderOfferFormData) =>
      ordersApi.orgOffer(token!, orgId, orderId, {
        offered_cost: data.offered_cost,
        offered_start_date: data.offered_start_date,
        offered_end_date: data.offered_end_date,
      }),
    onSuccess: () => {
      toast.success(t("orgOrders.offered"));
      invalidate();
    },
    onError: (e) => {
      toast.error(e instanceof ApiRequestError ? String(e.detail) : t("common.error"));
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => ordersApi.orgApprove(token!, orgId, orderId),
    onSuccess: () => {
      toast.success(t("orgOrders.approved"));
      invalidate();
    },
    onError: (e) => {
      if (e instanceof ApiRequestError && e.status === 409) {
        toast.error(t("orgOrders.approveError"));
      } else {
        toast.error(e instanceof ApiRequestError ? String(e.detail) : t("common.error"));
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.orgCancel(token!, orgId, orderId),
    onSuccess: () => {
      toast.success(t("orgOrders.canceled"));
      invalidate();
    },
    onError: () => toast.error(t("common.error")),
  });

  if (isLoading || !order) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isPending =
    offerMutation.isPending || approveMutation.isPending || cancelMutation.isPending;

  return (
    <div className="p-6 lg:flex lg:flex-col lg:flex-1">
      <div className="flex items-start gap-16 mb-6">
        <div className="shrink-0 -mt-0.5">
          <BackButton />
        </div>
        <OrderStatusStepper status={order.status} />
      </div>

      <div className="lg:relative lg:overflow-clip lg:flex-1">
        {/* Left column — order info */}
        <div className="lg:w-1/2 space-y-6">

          {/* Actions — mobile: top, desktop: bottom */}
          <div className="lg:hidden">
            <OrderActionsBar
              order={order}
              side="org"
              onOffer={(data) => offerMutation.mutate(data)}
              onApprove={() => approveMutation.mutate()}
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
                href={`/${locale}/org/listings/${listing.id}`}
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

            {requester && (
              <div className="pt-3 border-t">
                <p className="text-xs text-zinc-400 mb-1">{t("orgOrders.detail.requester")}</p>
                <p className="font-medium">{requester.name} {requester.surname}</p>
                <p className="text-sm text-zinc-500">{requester.email}</p>
                {requester.phone && (
                  <p className="text-sm text-zinc-500">{requester.phone}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t">
              <div>
                <p className="text-xs text-zinc-400">{t("orgOrders.detail.requestedDates")}</p>
                <p className="font-medium">{formatDate(order.requested_start_date, locale)} — {formatDate(order.requested_end_date, locale)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">{t("orgOrders.detail.estimatedCost")}</p>
                <p className="font-medium">
                  {order.estimated_cost ? `${formatCost(order.estimated_cost)} ₽` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">{t("orgOrders.detail.orderId")}</p>
                <p className="font-mono text-xs text-zinc-500">#{order.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">{t("orgOrders.detail.created")}</p>
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
              side="org"
              onOffer={(data) => offerMutation.mutate(data)}
              onApprove={() => approveMutation.mutate()}
              onCancel={() => cancelMutation.mutate()}
              isPending={isPending}
            />
          </div>
        </div>

        {/* Right column — chat, absolute so it doesn't affect page height */}
        <div className="hidden lg:block lg:absolute lg:top-0 lg:right-0 lg:w-[calc(50%-1rem)]">
          <ChatPanel orderId={orderId} side="organization" orgId={orgId} translationPrefix="orgOrders" />
        </div>
      </div>
      <MobileChatButton orderId={orderId} side="organization" orgId={orgId} translationPrefix="orgOrders" />
    </div>
  );
}
