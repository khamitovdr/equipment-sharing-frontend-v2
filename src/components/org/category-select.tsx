"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { organizationsApi } from "@/lib/api/organizations";
import { listingsApi } from "@/lib/api/listings";
import { useAuthStore } from "@/lib/stores/auth-store";

const CREATE_NEW_VALUE = "__create_new__";

interface CategorySelectProps {
  value: string;
  onChange: (categoryId: string) => void;
  orgId: string;
  error?: string;
}

export function CategorySelect({
  value,
  onChange,
  orgId,
  error,
}: CategorySelectProps) {
  const t = useTranslations("listingForm");
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["org-listing-categories", orgId],
    queryFn: () => organizationsApi.availableCategories(token!, orgId),
    enabled: !!token && !!orgId,
  });

  function handleSelectChange(selected: string | null) {
    if (selected === CREATE_NEW_VALUE) {
      setShowCreate(true);
      return;
    }
    if (selected) {
      onChange(selected);
      setShowCreate(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim() || !token) return;
    setCreating(true);
    try {
      const created = await listingsApi.orgCreateCategory(token, orgId, {
        name: newName.trim(),
      });
      await queryClient.invalidateQueries({
        queryKey: ["org-listing-categories", orgId],
      });
      onChange(created.id);
      setShowCreate(false);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-2">
      <Select
        value={value || null}
        onValueChange={handleSelectChange}
      >
        <SelectTrigger
          className="w-full"
          aria-invalid={!!error}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </span>
          ) : (
            <SelectValue placeholder={t("category")}>
              {categories?.find((c) => c.id === value)?.name ?? t("category")}
            </SelectValue>
          )}
        </SelectTrigger>
        <SelectContent>
          {(categories ?? []).map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
          <SelectItem value={CREATE_NEW_VALUE}>
            <Plus className="size-4" />
            {t("categoryCreate")}
          </SelectItem>
        </SelectContent>
      </Select>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {showCreate && (
        <div className="flex gap-2">
          <Input
            placeholder={t("categoryName")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            disabled={!newName.trim() || creating}
            onClick={handleCreate}
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
