"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { ListingStatus } from "@/types/listing";

interface ListingStatusSelectProps {
  currentStatus: ListingStatus;
  onStatusChange: (status: ListingStatus) => void;
  disabled?: boolean;
}

const STATUS_STYLES: Record<ListingStatus, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  hidden: "bg-muted text-muted-foreground border-border",
  archived: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
};

const ALL_STATUSES: ListingStatus[] = ["published", "hidden", "archived"];

const ACTION_KEYS: Record<ListingStatus, string> = {
  published: "publish",
  hidden: "hide",
  archived: "archive",
};

export function ListingStatusSelect({
  currentStatus,
  onStatusChange,
  disabled,
}: ListingStatusSelectProps) {
  const t = useTranslations("orgListings");

  const transitions = ALL_STATUSES.filter((s) => s !== currentStatus);

  if (disabled) {
    return (
      <Badge className={STATUS_STYLES[currentStatus]} variant="outline">
        {t(`status.${currentStatus}`)}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1 focus-visible:outline-none"
        disabled={disabled}
      >
        <Badge className={STATUS_STYLES[currentStatus]} variant="outline">
          {t(`status.${currentStatus}`)}
          <ChevronDown className="size-3 ml-0.5" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {transitions.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => onStatusChange(status)}
          >
            {t(`actions.${ACTION_KEYS[status]}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
