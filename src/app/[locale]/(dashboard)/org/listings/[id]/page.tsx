"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Pencil, Settings, Truck, User, Wrench } from "lucide-react";

import { listingsApi } from "@/lib/api/listings";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrgGuard } from "@/lib/hooks/use-org-guard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCost } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { ListingStatusSelect } from "@/components/org/listing-status-select";
import { MediaCarousel } from "@/components/catalog/media-carousel";
import { EquipmentPlaceholder } from "@/components/shared/equipment-placeholder";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ordersApi } from "@/lib/api/orders";
import { BackButton } from "@/components/shared/back-button";
import { OrderTable } from "@/components/order/order-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { OrderRead } from "@/types/order";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrgListingDetailPage({ params }: PageProps) {
  const { id: listingId } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const token = useAuthStore((s) => s.token);
  const orgId = useOrgStore((s) => s.currentOrg?.id);
  const { hasRole: canEdit } = useOrgGuard({ minRole: "editor" });
  const queryClient = useQueryClient();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["org-listing", orgId, listingId],
    queryFn: () => listingsApi.orgGet(token!, orgId!, listingId),
    enabled: !!token && !!orgId,
  });

  async function handleStatusChange(status: "hidden" | "published" | "archived") {
    if (!token || !orgId) return;
    try {
      await listingsApi.orgUpdateStatus(token, orgId, listingId, { status });
      await queryClient.invalidateQueries({ queryKey: ["org-listing", orgId, listingId] });
      toast.success(t("orgListings.statusChanged"));
    } catch {
      toast.error(t("common.error"));
    }
  }

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["org-orders", orgId, { listing_id: listingId }],
    queryFn: ({ pageParam }) =>
      ordersApi.orgList(token!, orgId!, {
        listing_id: listingId,
        cursor: pageParam as string | null | undefined,
        limit: 10,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!token && !!orgId,
  });

  const orders = useMemo<OrderRead[]>(
    () => ordersData?.pages.flatMap((p) => p.items) ?? [],
    [ordersData]
  );

  if (isLoading || !listing) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-[4/3] w-full rounded-lg" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const serviceFlags = [
    { key: "delivery", label: t("catalog.delivery"), enabled: listing.delivery, icon: Truck },
    { key: "with_operator", label: t("catalog.withOperator"), enabled: listing.with_operator, icon: User },
    { key: "on_owner_site", label: t("catalog.onOwnerSite"), enabled: listing.on_owner_site, icon: MapPin },
    { key: "installation", label: t("catalog.installation"), enabled: listing.installation, icon: Wrench },
    { key: "setup", label: t("catalog.setup"), enabled: listing.setup, icon: Settings },
  ].filter((f) => f.enabled);

  return (
    <div className="p-6">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Left column */}
        <div className="flex flex-col gap-8 lg:w-[60%]">
          {listing.photos.length > 0 ? (
            <MediaCarousel photos={listing.photos} videos={listing.videos} />
          ) : (
            <EquipmentPlaceholder className="aspect-[4/3] w-full rounded-lg" />
          )}

          {listing.description && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{t("listing.description")}</h2>
              <div className="prose prose-sm prose-zinc max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{listing.description}</ReactMarkdown>
              </div>
            </section>
          )}

          {listing.specifications && Object.keys(listing.specifications).length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{t("listing.specifications")}</h2>
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(listing.specifications).map(([key, value]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">{key}</td>
                      <td className="py-2 font-medium">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:w-[40%]">
          {/* Status + Edit */}
          <div className="flex items-center justify-between gap-3">
            <ListingStatusSelect
              currentStatus={listing.status}
              onStatusChange={handleStatusChange}
              disabled={!canEdit}
            />
            {canEdit && (
              <Link
                href={`/${locale}/org/listings/${listingId}/edit`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
              >
                <Pencil className="size-4" />
                {t("orgListings.actions.edit")}
              </Link>
            )}
          </div>

          {/* Price & name */}
          <div>
            <span className="text-xs text-muted-foreground">{listing.category.name}</span>
            <h1 className="mt-1 text-xl font-bold leading-tight">{listing.name}</h1>
            <p className="mt-2 text-2xl font-bold">
              {formatCost(listing.price)}{" "}
              <span className="text-base font-normal text-muted-foreground">
                {t("catalog.perDay")}
              </span>
            </p>
          </div>

          {/* Service flags */}
          {serviceFlags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {serviceFlags.map((flag) => (
                <Badge key={flag.key} variant="secondary" className="gap-1.5 px-2.5 py-1">
                  <flag.icon className="h-3 w-3" />
                  {flag.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders section */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4">
          {t("orgOrders.listingOrders.title")}
          {orders.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({orders.length})
            </span>
          )}
        </h2>

        {ordersLoading ? (
          <OrderTable orders={[]} variant="org-listing" isLoading detailPath={() => ""} />
        ) : orders.length === 0 ? (
          <EmptyState message={t("orgOrders.listingOrders.empty")} />
        ) : (
          <>
            <OrderTable
              orders={orders}
              variant="org-listing"
              detailPath={(id) => `/${locale}/org/orders/${id}`}
            />
            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage && <Loader2 className="size-4 mr-2 animate-spin" />}
                  {t("common.loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
