import axios from "axios";
import { DaDataPartySuggestion } from "react-dadata";
import { Organization } from "src/models/organizations";

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
