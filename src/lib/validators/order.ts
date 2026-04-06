import { z } from "zod";

export const orderCreateSchema = z
  .object({
    listing_id: z.string(),
    requested_start_date: z.string(),
    requested_end_date: z.string(),
  })
  .refine(
    (data) => new Date(data.requested_start_date) < new Date(data.requested_end_date),
    { message: "Start date must be before end date", path: ["requested_end_date"] }
  );

export type OrderCreateFormData = z.infer<typeof orderCreateSchema>;
