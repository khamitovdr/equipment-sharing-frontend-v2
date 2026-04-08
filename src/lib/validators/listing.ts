import { z } from "zod";

export const catalogFiltersSchema = z.object({
  search: z.string().optional(),
  category_ids: z.array(z.string()).optional(),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().min(0).optional(),
  delivery: z.boolean().optional(),
  with_operator: z.boolean().optional(),
  on_owner_site: z.boolean().optional(),
  installation: z.boolean().optional(),
  setup: z.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
});

export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;

export const listingSchema = z.object({
  name: z.string().min(1, "nameRequired"),
  category_id: z.string().min(1, "categoryRequired"),
  price: z.number().gt(0, "pricePositive"),
  description: z.string().optional().default(""),
  specifications: z.record(z.string(), z.string()).optional(),
  with_operator: z.boolean().optional().default(false),
  on_owner_site: z.boolean().optional().default(false),
  delivery: z.boolean().optional().default(false),
  installation: z.boolean().optional().default(false),
  setup: z.boolean().optional().default(false),
  photo_ids: z.array(z.string()).max(10, "tooManyPhotos").optional().default([]),
});
export type ListingFormData = z.infer<typeof listingSchema>;
