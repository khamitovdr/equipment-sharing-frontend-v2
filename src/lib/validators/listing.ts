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
