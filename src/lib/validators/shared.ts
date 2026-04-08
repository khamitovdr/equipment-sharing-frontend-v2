import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "passwordMinLength")
  .refine((val) => /[a-zа-яё]/.test(val), "passwordLowercase")
  .refine((val) => /[A-ZА-ЯЁ]/.test(val), "passwordUppercase")
  .refine((val) => /\d/.test(val), "passwordDigit");
