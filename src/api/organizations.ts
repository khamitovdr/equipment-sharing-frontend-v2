import axios from "axios";
import { DaDataPartySuggestion } from "react-dadata";
import { Organization } from "src/models/organizations";
import { UserDetail } from "src/models/users";
import { Requisites } from "src/models/users";

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

// Users requisites
type UpdateUserRequisitesPayload = {
    payment_account: string;
    dadata_response: Record<string, unknown>;
};

export const updateUserRequisites = async (payload: UpdateUserRequisitesPayload) => {
    const { data } = await axios.put<Requisites>("/users/requisites/", payload);
    return data;
};

// Organization
export const getMyOrganization = async () => {
    const { data } = await axios.get<Organization>("/organizations/my-organization/");
    return data;
};

type OrgContactsUpdatePayload = {
    contact_phone: string;
    contact_email: string;
    contact_employee_name: string;
    contact_employee_middle_name?: string;
    contact_employee_surname?: string;
};

export const updateOrganizationContactsByMember = async (
    payload: OrgContactsUpdatePayload,
) => {
    const { data } = await axios.put<Organization>("/organizations/contacts/", payload);
    return data;
};
