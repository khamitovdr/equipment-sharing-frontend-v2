"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface CursorPaginationProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function CursorPagination({
  hasMore,
  isLoading,
  onLoadMore,
}: CursorPaginationProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (!hasMore && !isLoading) return null;

  return (
    <div ref={sentinelRef} className="flex justify-center py-8">
      {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
    </div>
  );
}
