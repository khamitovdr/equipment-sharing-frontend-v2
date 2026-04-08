"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentPlaceholder } from "@/components/shared/equipment-placeholder";
import { OrderStatusBadge } from "./order-status-badge";
import { listingsApi } from "@/lib/api/listings";
import { usersApi } from "@/lib/api/users";
import type { OrderRead } from "@/types/order";

type OrderTableVariant = "renter" | "org" | "org-listing";

interface OrderTableProps {
  orders: OrderRead[];
  variant: OrderTableVariant;
  isLoading?: boolean;
  detailPath: (orderId: string) => string;
}

export function OrderTable({ orders, variant, isLoading, detailPath }: OrderTableProps) {
  const t = useTranslations();
  const router = useRouter();

  if (isLoading) return <OrderTableSkeleton />;

  const showListing = variant !== "org-listing";
  const showRequester = variant === "org" || variant === "org-listing";
  const tPrefix = variant === "renter" ? "orders" : "orgOrders";

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-zinc-50/50 text-xs text-zinc-500 uppercase">
              {showListing && <th className="p-3 text-left font-medium">{t(`${tPrefix}.columns.listing`)}</th>}
              {showRequester && <th className="p-3 text-left font-medium">{t(`${tPrefix}.columns.requester`)}</th>}
              <th className="p-3 text-left font-medium">{t(`${tPrefix}.columns.status`)}</th>
              <th className="p-3 text-left font-medium">{t(`${tPrefix}.columns.dates`)}</th>
              <th className="p-3 text-left font-medium">{t(`${tPrefix}.columns.cost`)}</th>
              <th className="p-3 text-left font-medium">{t(`${tPrefix}.columns.id`)}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => router.push(detailPath(order.id))}
              >
                {showListing && (
                  <td className="p-3">
                    <ListingCell listingId={order.listing_id} />
                  </td>
                )}
                {showRequester && (
                  <td className="p-3">
                    <RequesterCell requesterId={order.requester_id} />
                  </td>
                )}
                <td className="p-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="p-3 text-zinc-600 whitespace-nowrap">
                  {order.requested_start_date} — {order.requested_end_date}
                </td>
                <td className="p-3 whitespace-nowrap font-medium">
                  <OrderCost order={order} />
                </td>
                <td className="p-3 text-zinc-400 text-xs font-mono">
                  #{order.id.slice(0, 8)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-lg border p-4 cursor-pointer hover:bg-muted/40 transition-colors space-y-2"
            onClick={() => router.push(detailPath(order.id))}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {showListing && <ListingCell listingId={order.listing_id} />}
                {showRequester && <RequesterCell requesterId={order.requester_id} />}
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>{order.requested_start_date} — {order.requested_end_date}</span>
              <span className="font-medium text-black"><OrderCost order={order} /></span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ListingCell({ listingId }: { listingId: string }) {
  const { data: listing } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => listingsApi.get(listingId),
    staleTime: 5 * 60 * 1000,
  });

  if (!listing) return <Skeleton className="h-4 w-32" />;

  return (
    <div className="flex items-center gap-2.5">
      {listing.photos[0]?.small_url ? (
        <img
          src={listing.photos[0].small_url}
          alt={listing.name}
          className="size-9 rounded object-cover shrink-0"
        />
      ) : (
        <EquipmentPlaceholder className="size-9 rounded shrink-0" />
      )}
      <span className="font-medium truncate">{listing.name}</span>
    </div>
  );
}

function RequesterCell({ requesterId }: { requesterId: string }) {
  const { data: user } = useQuery({
    queryKey: ["user", requesterId],
    queryFn: () => usersApi.getById(requesterId),
    staleTime: 5 * 60 * 1000,
  });

  if (!user) return <Skeleton className="h-4 w-24" />;

  return (
    <span className="text-sm">
      {user.name} {user.surname}
    </span>
  );
}

function OrderCost({ order }: { order: OrderRead }) {
  const cost = order.offered_cost ?? order.estimated_cost;
  if (!cost) return "—";
  return `${Number(cost).toLocaleString()} ₽`;
}

function OrderTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
          <Skeleton className="size-9 rounded shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
