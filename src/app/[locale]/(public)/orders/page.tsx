"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { ordersApi } from "@/lib/api/orders";
import { useAuthStore } from "@/lib/stores/auth-store";
import { OrderTable } from "@/components/order/order-table";
import { OrderFilters } from "@/components/order/order-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { OrderRead, OrderStatus } from "@/types/order";

export default function OrdersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = useMemo(
    () => ({
      search: search || undefined,
      status: (status as OrderStatus) || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [search, status, dateFrom, dateTo]
  );

  const hasActiveFilters = !!(search || status || dateFrom || dateTo);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["orders", queryParams],
    queryFn: ({ pageParam }) =>
      ordersApi.list(token!, {
        ...queryParams,
        cursor: pageParam as string | null | undefined,
        limit: 20,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!token,
  });

  const orders = useMemo<OrderRead[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  }, []);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("orders.title")}
      </h1>

      <OrderFilters
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={setStatus}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        translationPrefix="orders"
      />

      {isLoading ? (
        <OrderTable orders={[]} variant="renter" isLoading detailPath={() => ""} />
      ) : orders.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            message={t("orders.emptyFiltered")}
            ctaLabel={t("common.clearFilters")}
            onCtaClick={clearFilters}
          />
        ) : (
          <EmptyState
            message={t("orders.empty")}
            ctaLabel={t("orders.browseCatalog")}
            onCtaClick={() => router.push(`/${locale}/listings`)}
          />
        )
      ) : (
        <>
          <OrderTable
            orders={orders}
            variant="renter"
            detailPath={(id) => `/${locale}/orders/${id}`}
          />
          {hasNextPage && (
            <div className="flex justify-center pt-2">
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
  );
}
