"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MediaPhotoRead, MediaVideoRead } from "@/types/listing";

interface MediaItem {
  type: "photo" | "video";
  url: string;
  thumbnailUrl: string;
}

interface MediaCarouselProps {
  photos: MediaPhotoRead[];
  videos: MediaVideoRead[];
}

export function MediaCarousel({ photos, videos }: MediaCarouselProps) {
  const t = useTranslations();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const sortedPhotos = [...photos]
    .filter((p) => p.large_url !== null || p.medium_url !== null || p.small_url !== null)
    .sort((a, b) => a.position - b.position);

  const mediaItems: MediaItem[] = [
    ...sortedPhotos.map((p) => ({
      type: "photo" as const,
      url: p.large_url ?? p.medium_url ?? p.small_url ?? "",
      thumbnailUrl: p.small_url ?? p.medium_url ?? p.large_url ?? "",
    })),
    ...videos
      .filter((v) => v.full_url !== null)
      .map((v) => ({
        type: "video" as const,
        url: v.full_url ?? "",
        thumbnailUrl: v.preview_url ?? v.full_url ?? "",
      })),
  ];

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (mediaItems.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400">
        {t("common.noMedia")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Main carousel */}
      <div className="relative overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {mediaItems.map((item, i) => (
            <div
              key={i}
              className="relative min-w-0 flex-[0_0_100%]"
            >
              {item.type === "photo" ? (
                <img
                  src={item.url}
                  alt={`Media ${i + 1}`}
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <video
                  src={item.url}
                  controls
                  className="aspect-[16/10] w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {/* Prev button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Next button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumbnail strip */}
      {mediaItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {mediaItems.map((item, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={cn(
                "relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md",
                i === selectedIndex
                  ? "border-2 border-black"
                  : "border-2 border-transparent"
              )}
              aria-label={`Go to media ${i + 1}`}
            >
              {item.type === "photo" ? (
                <img
                  src={item.thumbnailUrl}
                  alt={`Thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100">
                  <video
                    src={item.thumbnailUrl}
                    className="h-full w-full object-cover"
                    muted
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
