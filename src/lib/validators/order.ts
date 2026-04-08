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

export const orderOfferSchema = z
  .object({
    offered_cost: z.string().refine((v) => Number(v) > 0, {
      message: "Cost must be greater than 0",
    }),
    offered_start_date: z.string().min(1, "Start date is required"),
    offered_end_date: z.string().min(1, "End date is required"),
  })
  .refine(
    (data) => new Date(data.offered_start_date) < new Date(data.offered_end_date),
    { message: "Start date must be before end date", path: ["offered_end_date"] }
  );

export type OrderOfferFormData = z.infer<typeof orderOfferSchema>;
