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
): Promise<readonly DaDataPartySuggestion[]> => {
	const { data } = await axiosInstance.post("/suggest/party", { query });
	return data.suggestions;
};
