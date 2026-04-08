"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CheckCircle, Mail, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingGrid } from "@/components/catalog/listing-grid";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { CursorPagination } from "@/components/shared/cursor-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { BackButton } from "@/components/shared/back-button";
import { OrgPlaceholder } from "@/components/shared/org-placeholder";
import { organizationsApi } from "@/lib/api/organizations";
import { listingsApi } from "@/lib/api/listings";
import type { ListingCategoryRead } from "@/types/listing";
import type { ListingRead } from "@/types/listing";

function OrgProfileSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="h-5 w-16 mb-6" />
      <div className="flex flex-col lg:flex-row lg:items-start gap-8">
        {/* Sidebar skeleton */}
        <div className="lg:w-72 lg:shrink-0 space-y-6">
          <div className="flex flex-col items-center lg:items-start gap-3">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
        {/* Listings skeleton */}
        <div className="min-w-0 flex-1">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="mb-5 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrgProfilePage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Fetch org
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: () => organizationsApi.get(id),
    staleTime: 60 * 1000,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<ListingCategoryRead[]>({
    queryKey: ["org-categories", id],
    queryFn: () => organizationsApi.categories(id),
    staleTime: 60 * 1000,
  });

  // Fetch listings (infinite)
  const {
    data: listingsData,
    isLoading: listingsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["listings", { organization_id: id, category_id: selectedCategories }],
    queryFn: ({ pageParam }) =>
      listingsApi.list({
        organization_id: id,
        category_id: selectedCategories.length ? selectedCategories : undefined,
        cursor: pageParam as string | null | undefined,
        limit: 20,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    staleTime: 30 * 1000,
  });

  const listings = useMemo<ListingRead[]>(
    () => listingsData?.pages.flatMap((p) => p.items) ?? [],
    [listingsData]
  );

  if (orgLoading) {
    return <OrgProfileSkeleton />;
  }

  if (!org) {
    return null;
  }

  const orgDisplayName = org.short_name ?? org.full_name ?? org.inn;
  const orgInitial = orgDisplayName.charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-8">
        {/* Sidebar — org info */}
        <div className="lg:w-72 lg:shrink-0 lg:sticky lg:top-[72px] space-y-6">
          {/* Photo + name */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {org.photo ? (
              <img
                src={org.photo.medium_url}
                alt={orgDisplayName}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <OrgPlaceholder className="h-24 w-24" />
            )}
            <h1 className="mt-3 text-xl font-bold leading-tight">{orgDisplayName}</h1>
            {org.status === "verified" && (
              <div className="mt-1 flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                <span>{t("org.verified")}</span>
              </div>
            )}
            {org.legal_address && (
              <p className="mt-2 text-sm text-zinc-500">
                {org.legal_address}
              </p>
            )}
          </div>

          {/* Contacts */}
          {org.contacts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase">{t("org.contacts")}</h2>
              {org.contacts.map((contact) => (
                <div key={contact.id} className="rounded-lg border p-3">
                  <p className="mb-1.5 text-sm font-medium">{contact.display_name}</p>
                  {contact.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-600">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main — listings */}
        <div className="min-w-0 flex-1">
          <h2 className="mb-4 text-lg font-semibold">{t("org.listings")}</h2>

          {categories.length > 0 && (
            <div className="mb-5">
              <CategoryFilter
                categories={categories}
                selected={selectedCategories}
                onChange={setSelectedCategories}
              />
            </div>
          )}

          {listingsLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState message={t("org.noListings")} />
          ) : (
            <>
              <ListingGrid listings={listings} />
              <CursorPagination
                hasMore={hasNextPage ?? false}
                isLoading={isFetchingNextPage}
                onLoadMore={fetchNextPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
