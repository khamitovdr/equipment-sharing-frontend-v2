"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";

import { listingsApi } from "@/lib/api/listings";
import { organizationsApi } from "@/lib/api/organizations";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrgGuard } from "@/lib/hooks/use-org-guard";
import { ListingStatusSelect } from "@/components/org/listing-status-select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { ListingRead, ListingStatus } from "@/types/listing";

export default function OrgListingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();

  const token = useAuthStore((s) => s.token);
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const orgId = currentOrg?.id ?? "";

  const { hasRole: canEdit } = useOrgGuard({ minRole: "editor" });

  // Filter state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ListingStatus | "">("");
  const [categoryId, setCategoryId] = useState<string>("");

  // Delete dialog state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch available categories
  const { data: categories = [] } = useQuery({
    queryKey: ["org-listing-categories-available", orgId],
    queryFn: () => organizationsApi.availableCategories(token!, orgId),
    enabled: !!token && !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  // Build query params
  const queryParams = useMemo(
    () => ({
      search: search || undefined,
      status: (status as ListingStatus) || undefined,
      category_id: categoryId || undefined,
    }),
    [search, status, categoryId]
  );

  const hasActiveFilters = !!(search || status || categoryId);

  // Infinite query
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["org-listings", orgId, queryParams],
    queryFn: ({ pageParam }) =>
      listingsApi.orgList(token!, orgId, {
        ...queryParams,
        cursor: pageParam as string | null | undefined,
        limit: 20,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!token && !!orgId,
  });

  const listings = useMemo<ListingRead[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  // Status change handler
  const handleStatusChange = useCallback(
    async (listingId: string, newStatus: ListingStatus) => {
      if (!token || !orgId) return;
      try {
        await listingsApi.orgUpdateStatus(token, orgId, listingId, { status: newStatus });
        await queryClient.invalidateQueries({ queryKey: ["org-listings", orgId] });
        toast.success(t("orgListings.statusChanged"));
      } catch {
        toast.error(t("errors.serverError"));
      }
    },
    [token, orgId, queryClient, t]
  );

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!token || !orgId || !deleteTargetId) return;
    setIsDeleting(true);
    try {
      await listingsApi.orgDelete(token, orgId, deleteTargetId);
      await queryClient.invalidateQueries({ queryKey: ["org-listings", orgId] });
      toast.success(t("orgListings.deleted"));
    } catch {
      toast.error(t("errors.serverError"));
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  }, [token, orgId, deleteTargetId, queryClient, t]);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setCategoryId("");
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("orgListings.title")}
        </h1>
        {canEdit && (
          <Button render={<Link href={`/${locale}/org/listings/new`} />}>
            <Plus className="size-4 mr-2" />
            {t("orgListings.create")}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8"
            placeholder={t("orgListings.search.placeholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          value={categoryId || null}
          onValueChange={(v) => setCategoryId(v ?? "")}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("orgListings.filter.allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("orgListings.filter.allCategories")}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status || null}
          onValueChange={(v) => setStatus((v ?? "") as ListingStatus | "")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder={t("orgListings.filter.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("orgListings.filter.allStatuses")}</SelectItem>
            <SelectItem value="hidden">{t("orgListings.actions.hide")}</SelectItem>
            <SelectItem value="published">{t("orgListings.actions.publish")}</SelectItem>
            <SelectItem value="archived">{t("orgListings.actions.archive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonRows />
      ) : listings.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            message={t("orgListings.emptyFiltered")}
            ctaLabel={t("common.clearFilters")}
            onCtaClick={clearFilters}
          />
        ) : (
          <EmptyState
            message={t("orgListings.empty")}
            ctaLabel={canEdit ? t("orgListings.create") : undefined}
            onCtaClick={
              canEdit
                ? () => router.push(`/${locale}/org/listings/new`)
                : undefined
            }
          />
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-muted/40 transition-colors">
                    {/* Thumbnail */}
                    <td className="p-3 w-14">
                      {listing.photos[0]?.small_url ? (
                        <img
                          src={listing.photos[0].small_url}
                          alt={listing.name}
                          className="size-10 rounded object-cover"
                        />
                      ) : (
                        <div className="size-10 rounded bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            {t("common.noPhoto")}
                          </span>
                        </div>
                      )}
                    </td>
                    {/* Name */}
                    <td className="p-3 font-medium">{listing.name}</td>
                    {/* Category */}
                    <td className="p-3 text-muted-foreground">
                      {listing.category.name}
                    </td>
                    {/* Price */}
                    <td className="p-3 whitespace-nowrap">
                      {listing.price.toLocaleString()} / {t("catalog.perDay")}
                    </td>
                    {/* Status */}
                    <td className="p-3">
                      <ListingStatusSelect
                        currentStatus={listing.status}
                        onStatusChange={(s) => handleStatusChange(listing.id, s)}
                        disabled={!canEdit}
                      />
                    </td>
                    {/* Actions */}
                    <td className="p-3 w-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="sm" className="size-8 p-0" />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/${locale}/org/listings/${listing.id}/edit`)
                            }
                          >
                            <Pencil className="size-4 mr-2" />
                            {t("orgListings.actions.edit")}
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTargetId(listing.id)}
                            >
                              <Trash2 className="size-4 mr-2" />
                              {t("orgListings.actions.delete")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="rounded-lg border p-4 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() =>
                  router.push(`/${locale}/org/listings/${listing.id}/edit`)
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{listing.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {listing.category.name} &middot;{" "}
                      {listing.price.toLocaleString()} / {t("catalog.perDay")}
                    </p>
                  </div>
                  <ListingStatusSelect
                    currentStatus={listing.status}
                    onStatusChange={(s) => handleStatusChange(listing.id, s)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : null}
                {t("common.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title={t("orgListings.actions.delete")}
        description={t("orgListings.deleteConfirm")}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
          <Skeleton className="size-10 rounded shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="size-8 rounded" />
        </div>
      ))}
    </div>
  );
}
