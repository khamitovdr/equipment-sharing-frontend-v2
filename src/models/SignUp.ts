import { z } from "zod";
import isPhoneValid from "../utils/phoneValidation";

export const NameEmailSchema = z.object({
	name: z.string().min(1, "Поле не может быть пустым"),
	middle_name: z.string(),
	surname: z.string().min(1, "Поле не может быть пустым"),
	email: z.string().email("Введите корректный email"),
});

export const PasswordSchema = z.object({
	password: z
		.string()
		.min(8, "Пароль должен быть не менее 8 символов")
		.regex(/[A-ZА-Я]/, {
			message: "Пароль должен содержать хотя бы одну заглавную букву",
		})
		.regex(/[a-zа-я]/, {
			message: "Пароль должен содержать хотя бы одну строчную букву",
		})
		.regex(/[0-9]/, { message: "Пароль должен содержать хотя бы одну цифру" })
		.regex(/[^a-zа-яA-ZА-Я0-9]/, {
			message:
				"Пароль должен содержать хотя бы один спецсимвол, например: !@#$%^&*() и т.д.",
		}),
});

export const PasswordConfirmationSchema = PasswordSchema.merge(
	z.object({
		passwordConfirmation: z.string(),
	}),
).refine((data) => data.password === data.passwordConfirmation, {
	message: "Пароли должны совпадать",
	path: ["passwordConfirmation"],
});

export const PhoneSchema = z.object({
	phone: z.string().refine(isPhoneValid, {
		message: "Введите корректный номер телефона",
	}),
});

export const OrganizationSchema = z.object({
	organization_inn: z.string().refine(
		(data) => {
			return data.length === 8 || data.length === 10;
		},
		{
			message: "ИНН должен состоять из 8 или 10 цифр",
		},
	),
});

export const UserDataSchema = z.object({
	is_owner: z.boolean(),
	...NameEmailSchema.shape,
	...PasswordSchema.shape,
	...PhoneSchema.shape,
	...OrganizationSchema.shape,
});

export type UserData = z.infer<typeof UserDataSchema>;
