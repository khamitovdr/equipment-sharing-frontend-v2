import { z } from "zod";
import { postOrganization } from "../api/organizations";
import { DaDataPartySuggestion } from "react-dadata";

export const UserOrganizationSchema = z.object({
	organization_inn: z
		.record(z.string(), z.any())
		.transform(async (data) => {
			console.log("Transforming data: ", data);
			const organization = await postOrganization({
				suggestion: data as unknown as DaDataPartySuggestion,
			});
			console.log("Transformed data: ", organization.inn);
			return organization.inn;
		})
		.refine(
			(data) => {
				return data.length === 8 || data.length === 10;
			},
			{
				message: "ИНН должен состоять из 8 или 10 цифр",
			},
		),
});
