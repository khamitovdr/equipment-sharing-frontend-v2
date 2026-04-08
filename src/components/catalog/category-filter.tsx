"use client";

import { X } from "lucide-react";
import type { ListingCategoryRead } from "@/types/listing";

interface CategoryFilterProps {
  categories: ListingCategoryRead[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  if (categories.length === 0) return null;

  const hasSelection = selected.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {categories.map((cat) => {
        const isActive = selected.includes(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              const next = isActive
                ? selected.filter((id) => id !== cat.id)
                : [...selected, cat.id];
              onChange(next);
            }}
            className={`flex-grow rounded-full border px-2.5 py-0.5 text-xs text-center transition-colors ${
              isActive
                ? "border-black bg-black text-white"
                : "border-input bg-transparent text-foreground hover:bg-muted"
            }`}
          >
            {cat.name}
          </button>
        );
      })}
      {hasSelection && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
