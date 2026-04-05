"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CheckCircle, Mail, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingGrid } from "@/components/catalog/listing-grid";
import { CursorPagination } from "@/components/shared/cursor-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { organizationsApi } from "@/lib/api/organizations";
import { listingsApi } from "@/lib/api/listings";
import type { ListingCategoryRead } from "@/types/listing";
import type { ListingRead } from "@/types/listing";

function OrgProfileSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8 flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      {/* Contacts skeleton */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      {/* Pills skeleton */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}

export default function OrgProfilePage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
    queryKey: ["listings", { organization_id: id, category_id: selectedCategory }],
    queryFn: ({ pageParam }) =>
      listingsApi.list({
        organization_id: id,
        category_id: selectedCategory,
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
      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        {org.photo ? (
          <img
            src={org.photo.medium_url}
            alt={orgDisplayName}
            className="h-20 w-20 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-2xl font-semibold text-zinc-600">
            {orgInitial}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight">{orgDisplayName}</h1>
          {org.status === "verified" && (
            <div className="mt-1 flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              <span>{t("org.verified")}</span>
            </div>
          )}
          {org.legal_address && (
            <p className="mt-1 text-sm text-zinc-500">
              <span className="font-medium">{t("org.legalAddress")}:</span>{" "}
              {org.legal_address}
            </p>
          )}
        </div>
      </div>

      {/* Contacts */}
      {org.contacts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold">{t("org.contacts")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {org.contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border p-3">
                <p className="mb-2 font-medium">{contact.display_name}</p>
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
        </section>
      )}

      {/* Listings section */}
      <section>
        <h2 className="mb-4 text-base font-semibold">{t("org.listings")}</h2>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={[
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                selectedCategory === null
                  ? "border-black bg-black text-white"
                  : "border-zinc-200 hover:border-zinc-400",
              ].join(" ")}
            >
              {t("common.all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === cat.id ? null : cat.id
                  )
                }
                className={[
                  "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                  selectedCategory === cat.id
                    ? "border-black bg-black text-white"
                    : "border-zinc-200 hover:border-zinc-400",
                ].join(" ")}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Listings grid */}
        {listingsLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>
    </div>
  );
}
