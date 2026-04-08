import { ListingCard } from "./listing-card";
import { ListingRow } from "./listing-row";
import type { ListingRead } from "@/types/listing";

interface ListingGridProps {
  listings: ListingRead[];
}

export function ListingGrid({ listings }: ListingGridProps) {
  return (
    <>
      {/* Mobile: compact rows */}
      <div className="flex flex-col gap-2 sm:hidden">
        {listings.map((listing) => (
          <ListingRow key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Tablet+: card grid */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </>
  );
}
