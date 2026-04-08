import { z } from "zod";
import { passwordSchema } from "./shared";

export const profileSchema = z.object({
  name: z.string().min(1, "nameRequired"),
  surname: z.string().min(1, "surnameRequired"),
  middle_name: z.string().optional().default(""),
  email: z.string().email("emailInvalid"),
  phone: z.string().regex(
    /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
    "phoneInvalid"
  ),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    password: z.string().min(1, "currentPasswordRequired"),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, "confirmPasswordRequired"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "passwordMismatch",
    path: ["confirm_password"],
  });

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
