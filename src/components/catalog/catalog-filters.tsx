"use client";

import { useTranslations } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CatalogFilters } from "@/lib/validators/listing";
import type { ListingCategoryRead } from "@/types/listing";

interface CatalogFiltersProps {
  filters: CatalogFilters;
  categories: ListingCategoryRead[];
  onChange: (filters: Partial<CatalogFilters>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const SERVICE_FLAGS = [
  { key: "delivery", labelKey: "catalog.delivery" },
  { key: "with_operator", labelKey: "catalog.withOperator" },
  { key: "on_owner_site", labelKey: "catalog.onOwnerSite" },
  { key: "installation", labelKey: "catalog.installation" },
  { key: "setup", labelKey: "catalog.setup" },
] as const;

export function CatalogFilters({
  filters,
  categories,
  onChange,
  onClear,
  hasActiveFilters,
}: CatalogFiltersProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      {/* Categories */}
      <div>
        <p className="mb-2 text-sm font-medium">{t("catalog.categories")}</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = filters.category_id === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onChange({ category_id: isActive ? undefined : cat.id })
                }
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? "border-black bg-black text-white"
                    : "border-input bg-transparent text-foreground hover:bg-muted"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="mb-2 text-sm font-medium">{t("catalog.priceRange")}</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder={t("catalog.priceMin")}
            value={filters.price_min ?? ""}
            onChange={(e) =>
              onChange({
                price_min: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            min={0}
            placeholder={t("catalog.priceMax")}
            value={filters.price_max ?? ""}
            onChange={(e) =>
              onChange({
                price_max: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      {/* Service flags */}
      <div>
        <p className="mb-2 text-sm font-medium">{t("catalog.services")}</p>
        <div className="flex flex-col gap-2">
          {SERVICE_FLAGS.map(({ key, labelKey }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={filters[key] === true}
                onCheckedChange={(checked) =>
                  onChange({ [key]: checked === true ? true : undefined })
                }
              />
              <span className="text-sm">{t(labelKey)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="mb-2 text-sm font-medium">{t("catalog.sort")}</p>
        <Select
          value={filters.sort ?? "newest"}
          onValueChange={(value) =>
            onChange({
              sort: value as CatalogFilters["sort"],
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("catalog.sort.newest")}</SelectItem>
            <SelectItem value="price_asc">
              {t("catalog.sort.priceAsc")}
            </SelectItem>
            <SelectItem value="price_desc">
              {t("catalog.sort.priceDesc")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>
          {t("common.clearFilters")}
        </Button>
      )}
    </div>
  );
}
