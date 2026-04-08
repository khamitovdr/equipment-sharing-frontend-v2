"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { listingSchema, type ListingFormData } from "@/lib/validators/listing";
import { CategorySelect } from "@/components/org/category-select";
import { SpecsEditor } from "@/components/org/specs-editor";
import { PhotoGrid, type PhotoItem } from "@/components/org/photo-grid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SpecItem = { key: string; value: string };

type ListingFormValues = ListingFormData & {
  specifications_list: SpecItem[];
};

export interface ListingFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<ListingFormData>;
  existingPhotos?: { id: string; url: string }[];
  onSubmit: (data: ListingFormData) => Promise<void>;
  isSubmitting: boolean;
  orgId: string;
}

const FLAG_FIELDS = [
  { name: "with_operator", labelKey: "flags.withOperator" },
  { name: "on_owner_site", labelKey: "flags.onOwnerSite" },
  { name: "delivery", labelKey: "flags.delivery" },
  { name: "installation", labelKey: "flags.installation" },
  { name: "setup", labelKey: "flags.setup" },
] as const;

function specsToList(specs?: Record<string, string>): SpecItem[] {
  if (!specs) return [];
  return Object.entries(specs).map(([key, value]) => ({ key, value }));
}

export function ListingForm({
  mode,
  defaultValues,
  existingPhotos = [],
  onSubmit,
  isSubmitting,
  orgId,
}: ListingFormProps) {
  const t = useTranslations("listingForm");

  const [photos, setPhotos] = useState<PhotoItem[]>(existingPhotos);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema) as any,
    defaultValues: {
      name: "",
      category_id: "",
      price: 0,
      description: "",
      with_operator: false,
      on_owner_site: false,
      delivery: false,
      installation: false,
      setup: false,
      photo_ids: [],
      specifications_list: specsToList(defaultValues?.specifications),
      ...defaultValues,
    },
  });

  async function handleFormSubmit(data: ListingFormValues) {
    const specs: Record<string, string> = {};
    for (const { key, value } of data.specifications_list ?? []) {
      if (key.trim() && value.trim()) {
        specs[key.trim()] = value.trim();
      }
    }

    const payload: ListingFormData = {
      name: data.name,
      category_id: data.category_id,
      price: data.price,
      description: data.description,
      specifications: Object.keys(specs).length > 0 ? specs : undefined,
      with_operator: data.with_operator,
      on_owner_site: data.on_owner_site,
      delivery: data.delivery,
      installation: data.installation,
      setup: data.setup,
      photo_ids: photos.map((p) => p.id),
    };

    await onSubmit(payload);
  }

  function handlePhotosChange(updated: PhotoItem[]) {
    setPhotos(updated);
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="max-w-2xl space-y-4"
    >
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? t("createTitle") : t("editTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message
                  ? t(`validation.${errors.name.message}` as any)
                  : null}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>{t("category")}</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <CategorySelect
                  value={field.value}
                  onChange={field.onChange}
                  orgId={orgId}
                  error={
                    errors.category_id?.message
                      ? t(`validation.${errors.category_id.message}` as any)
                      : undefined
                  }
                />
              )}
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label htmlFor="price">{t("price")}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="price"
                type="number"
                min={0}
                step={1}
                aria-invalid={!!errors.price}
                className="w-40"
                {...register("price", { valueAsNumber: true })}
              />
              <span className="text-sm text-muted-foreground">
                {t("pricePerDay")}
              </span>
            </div>
            {errors.price && (
              <p className="text-xs text-destructive">
                {errors.price.message
                  ? t(`validation.${errors.price.message}` as any)
                  : null}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>{t("description")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <textarea
            rows={5}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 resize-y"
            {...register("description")}
          />
          <p className="text-xs text-muted-foreground">{t("descriptionHint")}</p>
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t("specs.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SpecsEditor control={control as any} />
        </CardContent>
      </Card>

      {/* Service Flags */}
      <Card>
        <CardHeader>
          <CardTitle>{t("flags.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {FLAG_FIELDS.map(({ name, labelKey }) => (
            <div key={name} className="flex items-center gap-2">
              <Controller
                name={name}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id={name}
                    checked={field.value ?? false}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                )}
              />
              <Label htmlFor={name} className="cursor-pointer font-normal">
                {t(labelKey as any)}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>{t("photos.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoGrid
            photos={photos}
            onChange={handlePhotosChange}
            maxPhotos={10}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
        {t("save")}
      </Button>
    </form>
  );
}
