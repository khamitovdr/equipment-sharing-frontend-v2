import axios from "axios";
import { DaDataPartySuggestion } from "react-dadata";
import { Organization } from "src/models/organizations";
import { UserDetail } from "src/models/users";

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

// Users
export const getCurrentUser = async () => {
    const { data } = await axios.get<UserDetail>("/users/me/");
    return data;
};

type UpdateCurrentUserPayload = Partial<{
    is_owner: boolean;
    email: string;
    phone: string;
    name: string;
    middle_name: string;
    surname: string;
    password: string;
    organization_inn: string;
    new_password: string;
}>;

export const updateCurrentUser = async (payload: UpdateCurrentUserPayload) => {
    const { data } = await axios.put<UserDetail>("/users/me/", payload);
    return data;
};
