"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ListingRead } from "@/types/listing";
import { EquipmentPlaceholder } from "@/components/shared/equipment-placeholder";
import { formatCost } from "@/lib/utils";

interface ListingRowProps {
  listing: ListingRead;
}

export function ListingRow({ listing }: ListingRowProps) {
  const t = useTranslations();
  const photo = [...listing.photos].sort((a, b) => a.position - b.position)[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex items-center gap-3 rounded-lg border bg-white p-3 hover:bg-zinc-50 transition-colors"
    >
      {photo ? (
        <img
          src={photo.small_url ?? photo.medium_url ?? ""}
          alt={listing.name}
          className="size-16 rounded-md object-cover shrink-0"
        />
      ) : (
        <EquipmentPlaceholder className="size-16 rounded-md shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <span className="text-xs text-zinc-500">{listing.category.name}</span>
        <h3 className="text-sm font-medium line-clamp-1">{listing.name}</h3>
        <p className="text-sm font-bold mt-0.5">
          {formatCost(listing.price)} {t("catalog.perDay")}
        </p>
      </div>
    </Link>
  );
}
