import { AxiosError } from "axios";
import { DaDataPartySuggestion } from "react-dadata";
import { z } from "zod";
import { postOrganization } from "../api/organizations";

export const UserOrganizationSchema = z
	.object({
		organization_inn: z.string().optional(),
		organization_data: z.record(z.string(), z.any(), {
			invalid_type_error: "Необходимо выбрать организацию из списка",
		}),
	})
	.refine(
		(data) => {
			const inn_length = data.organization_data.data.inn.length;
			return inn_length === 8 || inn_length === 10;
		},
		{
			message: "ИНН должен состоять из 8 или 10 цифр",
			path: ["organization_data"],
		},
	)
	.transform(async (data, ctx) => {
		if (data.organization_inn === data.organization_data.data.inn) {
			console.log("inn is the same");
			return data;
		}
		try {
			const organization = await postOrganization({
				suggestion: data.organization_data as unknown as DaDataPartySuggestion,
			});
			return {
				...data,
				organization_inn: organization.inn,
			};
		} catch (error) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: (error as AxiosError).message,
				path: ["organization_data"],
			});
		}
	});
