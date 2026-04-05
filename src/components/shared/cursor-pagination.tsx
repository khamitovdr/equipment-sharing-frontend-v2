"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

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
  const t = useTranslations();

  if (!hasMore) return null;

  return (
    <div className="flex justify-center py-8">
      <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
        {isLoading && <Loader2 className="animate-spin" />}
        {t("common.loadMore")}
      </Button>
    </div>
  );
}
