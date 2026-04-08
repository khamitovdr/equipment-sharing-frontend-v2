"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { OrderStatus } from "@/types/order";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "offered",
  "accepted",
  "confirmed",
  "active",
  "finished",
  "canceled_by_user",
  "canceled_by_organization",
  "expired",
];

interface OrderFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  status: OrderStatus | "";
  onStatusChange: (value: OrderStatus | "") => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  translationPrefix: "orders" | "orgOrders";
}

export function OrderFilters({
  searchValue,
  onSearchChange,
  status,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  translationPrefix,
}: OrderFiltersProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8"
          placeholder={t(`${translationPrefix}.search.placeholder`)}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select
        value={status || null}
        onValueChange={(v) => onStatusChange((v ?? "") as OrderStatus | "")}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder={t(`${translationPrefix}.filter.allStatuses`)}>
            {status ? t(`orders.status.${status}`) : t(`${translationPrefix}.filter.allStatuses`)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{t(`${translationPrefix}.filter.allStatuses`)}</SelectItem>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`orders.status.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        className="w-full sm:w-36"
        placeholder={t(`${translationPrefix}.filter.dateFrom`)}
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
      />
      <Input
        type="date"
        className="w-full sm:w-36"
        placeholder={t(`${translationPrefix}.filter.dateTo`)}
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
      />
    </div>
  );
}
