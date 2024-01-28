import axios from "axios";
import { DaDataPartySuggestion } from "react-dadata";

const axiosInstance = axios.create({
	baseURL: import.meta.env.VITE_DADATA_API_URL,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
		Authorization: `Token ${import.meta.env.VITE_DADATA_API_TOKEN}`,
	},
});

export const fetchOrganizationSuggestions = async (
	query: string,
	removeBranches = true,
): Promise<readonly DaDataPartySuggestion[]> => {
	const { data } = await axiosInstance.post("/suggest/party", { query });
	if (removeBranches) {
		return data.suggestions.filter(
			(suggestion: DaDataPartySuggestion) =>
				suggestion.data.branch_type === "MAIN",
		);
	}
	return data.suggestions;
};

export const fetchOrganizationSuggestionByInn = async (
	inn: string,
): Promise<DaDataPartySuggestion | undefined> => {
	const { data } = await axiosInstance.post("/findById/party", {
		query: inn,
		count: 1,
		status: ["ACTIVE"],
		branch_type: "MAIN",
	});
	if (data.suggestions.length === 0) {
		throw new Error("No suggestions found");
	}
	return data.suggestions[0];
};
