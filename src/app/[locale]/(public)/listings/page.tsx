"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";

import { listingsApi } from "@/lib/api/listings";
import { catalogFiltersSchema } from "@/lib/validators/listing";
import type { CatalogFilters } from "@/lib/validators/listing";
import { SearchBar } from "@/components/catalog/search-bar";
import { CatalogFilters as CatalogFiltersPanel } from "@/components/catalog/catalog-filters";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { ListingGrid } from "@/components/catalog/listing-grid";
import { CursorPagination } from "@/components/shared/cursor-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ListingRead } from "@/types/listing";

function hasActiveFilters(filters: CatalogFilters): boolean {
  return Object.values(filters).some((v) => v !== undefined && v !== "");
}

function SkeletonGrid() {
  return (
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
  );
}

export default function CatalogPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse filters from URL search params
  const parsedFilters = useMemo<CatalogFilters>(() => {
    const raw: Record<string, unknown> = {};
    if (searchParams.get("search")) raw.search = searchParams.get("search");
    const categoryIds = searchParams.getAll("category_id");
    if (categoryIds.length) raw.category_ids = categoryIds;
    if (searchParams.get("price_min")) raw.price_min = searchParams.get("price_min");
    if (searchParams.get("price_max")) raw.price_max = searchParams.get("price_max");
    if (searchParams.get("delivery") === "true") raw.delivery = true;
    if (searchParams.get("with_operator") === "true") raw.with_operator = true;
    if (searchParams.get("on_owner_site") === "true") raw.on_owner_site = true;
    if (searchParams.get("installation") === "true") raw.installation = true;
    if (searchParams.get("setup") === "true") raw.setup = true;
    if (searchParams.get("sort")) raw.sort = searchParams.get("sort");

    const result = catalogFiltersSchema.safeParse(raw);
    return result.success ? result.data : {};
  }, [searchParams]);

  const activeFilters = useMemo(() => hasActiveFilters(parsedFilters), [parsedFilters]);

  const updateFilters = useCallback(
    (partial: Partial<CatalogFilters>) => {
      const next = { ...parsedFilters, ...partial };
      const params = new URLSearchParams();
      if (next.search) params.set("search", next.search);
      if (next.category_ids?.length) {
        for (const id of next.category_ids) params.append("category_id", id);
      }
      if (next.price_min !== undefined) params.set("price_min", String(next.price_min));
      if (next.price_max !== undefined) params.set("price_max", String(next.price_max));
      if (next.delivery) params.set("delivery", "true");
      if (next.with_operator) params.set("with_operator", "true");
      if (next.on_owner_site) params.set("on_owner_site", "true");
      if (next.installation) params.set("installation", "true");
      if (next.setup) params.set("setup", "true");
      if (next.sort) params.set("sort", next.sort);
      const qs = params.toString();
      router.replace(pathname + (qs ? "?" + qs : ""));
    },
    [parsedFilters, router, pathname]
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname);
  }, [router, pathname]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listingsApi.categories(),
    staleTime: 5 * 60 * 1000,
  });

  // Build query params from filters
  const queryParams = useMemo(() => {
    const params: Record<string, string | string[] | number | boolean | null | undefined> = {
      limit: 18,
    };
    if (parsedFilters.search) params.search = parsedFilters.search;
    if (parsedFilters.category_ids?.length) params.category_id = parsedFilters.category_ids;
    if (parsedFilters.price_min !== undefined) params.price_min = parsedFilters.price_min;
    if (parsedFilters.price_max !== undefined) params.price_max = parsedFilters.price_max;
    if (parsedFilters.delivery) params.delivery = true;
    if (parsedFilters.with_operator) params.with_operator = true;
    if (parsedFilters.on_owner_site) params.on_owner_site = true;
    if (parsedFilters.installation) params.installation = true;
    if (parsedFilters.setup) params.setup = true;
    if (parsedFilters.sort) params.sort = parsedFilters.sort;
    return params;
  }, [parsedFilters]);

  // Fetch listings with infinite query — key depends on URL-derived filters
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["listings", queryParams],
    queryFn: ({ pageParam }) =>
      listingsApi.list({
        ...queryParams,
        cursor: pageParam as string | null | undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });

  const listings = useMemo<ListingRead[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  const filtersPanel = (hideCategories?: boolean) => (
    <CatalogFiltersPanel
      filters={parsedFilters}
      categories={categories}
      onChange={updateFilters}
      onClear={clearFilters}
      hasActiveFilters={activeFilters}
      hideCategories={hideCategories}
    />
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page title */}
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {t("catalog.title")}
      </h1>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block lg:sticky lg:top-[72px] lg:self-start">
          {filtersPanel(true)}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Search bar */}
          <div className="mb-4">
            <SearchBar
              value={parsedFilters.search ?? ""}
              onChange={(value) => updateFilters({ search: value || undefined })}
            />
          </div>

          {/* Category pills — desktop only, mobile uses filter sheet */}
          {categories.length > 0 && (
            <div className="mb-6 hidden sm:block">
              <CategoryFilter
                categories={categories}
                selected={parsedFilters.category_ids ?? []}
                onChange={(ids) => updateFilters({ category_ids: ids.length > 0 ? ids : undefined })}
              />
            </div>
          )}

          {/* Mobile filter button */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <Sheet>
              <SheetTrigger render={<Button variant="outline" size="sm" />}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {t("catalog.filters")}
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto p-4">
                <SheetHeader>
                  <SheetTitle>{t("catalog.filters")}</SheetTitle>
                </SheetHeader>
                <div className="mt-4">{filtersPanel()}</div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Listings */}
          {isLoading ? (
            <SkeletonGrid />
          ) : listings.length === 0 ? (
            <EmptyState
              message={
                parsedFilters.search
                  ? t("catalog.noResultsSearch", { query: parsedFilters.search })
                  : t("catalog.noResults")
              }
              ctaLabel={activeFilters ? t("common.clearFilters") : undefined}
              onCtaClick={activeFilters ? clearFilters : undefined}
            />
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
