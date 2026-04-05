"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { ListingRead } from "@/types/listing";

interface ListingCardProps {
  listing: ListingRead;
}

export function ListingCard({ listing }: ListingCardProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const photos = [...listing.photos].sort((a, b) => a.position - b.position);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container || photos.length === 0) return;
    const rect = container.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const index = Math.min(
      Math.floor(ratio * photos.length),
      photos.length - 1
    );
    setActivePhotoIndex(index);
  }

  function handleMouseLeave() {
    setActivePhotoIndex(0);
  }

  const activePhoto = photos[activePhotoIndex];

  return (
    <Link href={`/listings/${listing.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow">
        <div
          ref={containerRef}
          className="relative aspect-[4/3] bg-zinc-100 overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {photos.length > 0 ? (
            <>
              <img
                src={activePhoto.medium_url ?? activePhoto.large_url ?? activePhoto.small_url ?? ""}
                alt={listing.name}
                className="h-full w-full object-cover"
              />
              {photos.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1">
                  {photos.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${
                        i === activePhotoIndex
                          ? "bg-white"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-300">
              No photo
            </div>
          )}
        </div>
        <CardContent className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">{listing.category.name}</span>
          <h3 className="text-sm font-medium line-clamp-1">{listing.name}</h3>
          <p className="text-sm font-bold">
            {listing.price.toLocaleString()} {t("catalog.perDay")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
