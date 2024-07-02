// TODO: Fix duplication of src/models/organizations.ts
export type Requisites = {
	payment_account: string;
	bank_bic: string;
	bank_inn: string;
	bank_name: string;
	bank_correspondent_account: string;
};

export type UserPreview = {
	id: number;
	email: string;
	is_owner: boolean;
	phone: string;
	name: string;
	middle_name: string;
	surname: string;
	disabled: boolean;
	is_verified_organization_member: boolean;
};

export type UserDetail = UserPreview & {
	requisites: Requisites | null;
};
