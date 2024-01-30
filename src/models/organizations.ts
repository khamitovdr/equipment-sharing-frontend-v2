import { z } from "zod";

export const OrganizationSchema = z.object({
	inn: z.string(),
	short_name: z.string().nullable(),
	full_name: z.string().nullable(),
	ogrn: z.string().nullable(),
	kpp: z.string().nullable(),
	registration_date: z.string().nullable(),
	authorized_capital_k_rubles: z.string().nullable(),
	legal_address: z.string().nullable(),
	manager_name: z.string().nullable(),
	main_activity: z.string().nullable(),
	contact_phone: z.string().nullable(),
	contact_email: z.string().nullable(),
	contact_employee_name: z.string().nullable(),
	contact_employee_middle_name: z.string().nullable(),
	contact_employee_surname: z.string().nullable(),
	requisites: z.object({
		payment_account: z.string().nullable(),
		bank_bic: z.string().nullable(),
		bank_inn: z.string().nullable(),
		bank_name: z.string().nullable(),
		bank_correspondent_account: z.string().nullable(),
	}),
});

export type Organization = z.infer<typeof OrganizationSchema>;
