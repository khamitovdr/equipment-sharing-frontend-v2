"use client";

import { differenceInDays, format } from "date-fns";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { listingsApi } from "@/lib/api/listings";
import { ordersApi } from "@/lib/api/orders";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatCost } from "@/lib/utils";
import { ReservationCalendar } from "./reservation-calendar";

interface OrderFormProps {
  listingId: string;
  pricePerDay: number;
}

export function OrderForm({ listingId, pricePerDay }: OrderFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, token } = useAuthStore();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations", listingId],
    queryFn: () => listingsApi.reservations(listingId),
  });

  const days =
    dateRange?.from && dateRange?.to
      ? Math.max(differenceInDays(dateRange.to, dateRange.from), 1)
      : 0;

  const estimatedCost = days * pricePerDay;

  const { mutate: createOrder, isPending } = useMutation({
    mutationFn: () => {
      if (!token || !dateRange?.from || !dateRange?.to) {
        throw new Error("Missing required data");
      }
      return ordersApi.create(token, {
        listing_id: listingId,
        requested_start_date: format(dateRange.from, "yyyy-MM-dd"),
        requested_end_date: format(dateRange.to, "yyyy-MM-dd"),
      });
    },
    onSuccess: (order) => {
      toast.success(t("listing.orderSuccess"));
      setDateRange(undefined);
      router.push(`/${locale}/orders/${order.id}`);
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  function handleSubmit() {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    createOrder();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">{t("listing.selectDates")}</p>

      <ReservationCalendar
        reservations={reservations}
        selected={dateRange}
        onSelect={setDateRange}
      />

      {dateRange?.from && dateRange?.to && (
        <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 text-sm">
          <span className="text-zinc-500">
            {t("listing.estimatedCost")} ({days} {t("listing.days")})
          </span>
          <span className="font-semibold">
            {formatCost(estimatedCost)} ₽
          </span>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending || (!isAuthenticated ? false : !dateRange?.from || !dateRange?.to)}
        className="w-full"
      >
        {isAuthenticated
          ? t("listing.requestRental")
          : t("listing.loginToOrder")}
      </Button>
    </div>
  );
}
