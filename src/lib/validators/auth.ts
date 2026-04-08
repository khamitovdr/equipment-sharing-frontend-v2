import { z } from "zod";
import { passwordSchema } from "./shared";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    surname: z.string().min(1, "Surname is required"),
    middle_name: z.string().optional(),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, "phoneInvalid"),
    password: passwordSchema,
    confirm_password: z.string().min(1, "confirmPasswordRequired"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "passwordMismatch",
    path: ["confirm_password"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
