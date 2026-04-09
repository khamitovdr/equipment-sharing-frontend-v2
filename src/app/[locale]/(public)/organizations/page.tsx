"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { organizationsApi } from "@/lib/api/organizations";
import { SearchBar } from "@/components/catalog/search-bar";
import { CursorPagination } from "@/components/shared/cursor-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { OrgPlaceholder } from "@/components/shared/org-placeholder";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrganizationListRead } from "@/types/organization";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border p-4">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrganizationsPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";

  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams();
      if (value) params.set("search", value);
      const qs = params.toString();
      router.replace(pathname + (qs ? "?" + qs : ""));
    },
    [router, pathname],
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["organizations", { search: search || undefined }],
    queryFn: ({ pageParam }) =>
      organizationsApi.list({
        search: search || undefined,
        cursor: pageParam as string | null | undefined,
        limit: 18,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });

  const organizations = useMemo<OrganizationListRead[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {t("organizations.title")}
      </h1>

      <div className="mb-6 max-w-md">
        <SearchBar
          value={search}
          onChange={updateSearch}
        />
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : organizations.length === 0 ? (
        <EmptyState
          message={
            search
              ? t("organizations.noResultsSearch", { query: search })
              : t("organizations.noResults")
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => {
              const displayName = org.short_name ?? org.full_name ?? org.inn;
              return (
                <Link
                  key={org.id}
                  href={`/organizations/${org.id}`}
                  className="flex items-center gap-4 rounded-xl border bg-background p-4 transition-all hover:shadow-md"
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
                    {org.photo?.small_url ? (
                      <Image
                        src={org.photo.small_url}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <OrgPlaceholder className="h-full w-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    {org.published_listing_count > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("org.listingCount", { count: org.published_listing_count })}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
          <CursorPagination
            hasMore={hasNextPage ?? false}
            isLoading={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          />
        </>
      )}
    </div>
  );
}
