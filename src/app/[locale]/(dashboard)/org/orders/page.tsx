"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { ordersApi } from "@/lib/api/orders";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { OrderTable } from "@/components/order/order-table";
import { OrderFilters } from "@/components/order/order-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { OrderRead, OrderStatus } from "@/types/order";

export default function OrgOrdersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const token = useAuthStore((s) => s.token);
  const orgId = useOrgStore((s) => s.currentOrg?.id) ?? "";

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
    queryKey: ["org-orders", orgId, queryParams],
    queryFn: ({ pageParam }) =>
      ordersApi.orgList(token!, orgId, {
        ...queryParams,
        cursor: pageParam as string | null | undefined,
        limit: 20,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!token && !!orgId,
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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("orgOrders.title")}
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
        translationPrefix="orgOrders"
      />

      {isLoading ? (
        <OrderTable orders={[]} variant="org" isLoading detailPath={() => ""} />
      ) : orders.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            message={t("orgOrders.emptyFiltered")}
            ctaLabel={t("common.clearFilters")}
            onCtaClick={clearFilters}
          />
        ) : (
          <EmptyState message={t("orgOrders.empty")} />
        )
      ) : (
        <>
          <OrderTable
            orders={orders}
            variant="org"
            detailPath={(id) => `/${locale}/org/orders/${id}`}
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
