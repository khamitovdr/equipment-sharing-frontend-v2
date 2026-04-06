import { ListingCard } from "./listing-card";
import type { ListingRead } from "@/types/listing";

interface ListingGridProps {
  listings: ListingRead[];
}

export function ListingGrid({ listings }: ListingGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
