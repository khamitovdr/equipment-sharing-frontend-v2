import axios from "axios";
import { Organization } from "../models/organizations";
import { DaDataPartySuggestion } from "react-dadata";

type PostOrganizationParams = {
	suggestion: DaDataPartySuggestion | null;
};

export const postOrganization = async ({
	suggestion,
}: PostOrganizationParams): Promise<Organization> => {
	if (!suggestion) {
		throw new Error("Suggestion is null");
	}
	const response = await axios.post<Organization>(
		"/organizations/",
		suggestion,
	);
	console.log(response);
	return response.data;
};
