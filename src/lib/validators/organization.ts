import { z } from "zod";

export const contactSchema = z.object({
  display_name: z.string().min(1, "displayNameRequired"),
  phone: z.string().regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, "phoneInvalid").optional().or(z.literal("")),
  email: z.string().email("emailInvalid").optional().or(z.literal("")),
});
export type ContactFormData = z.infer<typeof contactSchema>;

export const orgCreateSchema = z.object({
  inn: z.string().min(1, "innRequired"),
  contacts: z.array(contactSchema).min(1, "contactsMinOne"),
});
export type OrgCreateFormData = z.infer<typeof orgCreateSchema>;

export const contactsReplaceSchema = z.object({
  contacts: z.array(contactSchema).min(1, "contactsMinOne"),
});
export type ContactsReplaceFormData = z.infer<typeof contactsReplaceSchema>;
