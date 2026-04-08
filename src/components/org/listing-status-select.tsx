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
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  hidden: "bg-zinc-100 text-zinc-600 border-zinc-200",
  archived: "bg-amber-50 text-amber-700 border-amber-200",
};

const TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  hidden: ["published"],
  published: ["hidden", "archived"],
  archived: ["hidden"],
};

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
  const t = useTranslations("orgListings.actions");

  const transitions = TRANSITIONS[currentStatus];

  if (disabled || transitions.length === 0) {
    return (
      <Badge className={STATUS_STYLES[currentStatus]} variant="outline">
        {t(ACTION_KEYS[currentStatus])}
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
          {t(ACTION_KEYS[currentStatus])}
          <ChevronDown className="size-3 ml-0.5" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {transitions.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => onStatusChange(status)}
          >
            {t(ACTION_KEYS[status])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
