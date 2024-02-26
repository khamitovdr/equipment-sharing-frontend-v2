import axios from "axios";
import { EquipmentCategory, EquipmentPreview } from "src/models/equipment";

type FetchEquipmentCategoriesParams = {
	organization_inn?: string;
};

export const fetchEquipmentCategories = async (
	params: FetchEquipmentCategoriesParams,
) => {
	const { data } = await axios.get<EquipmentCategory[]>(
		"/equipment/categories/",
		{
			params,
		},
	);
	return data;
};

type FetchEquipmentListParams = {
	category_id?: number;
	organization_inn?: string;
	offset?: number;
	limit?: number;
};

export const fetchEquipmentList = async (params: FetchEquipmentListParams) => {
	const { data } = await axios.get<EquipmentPreview[]>("/equipment/", {
		params,
	});
	return data;
};

type FetchEquipmentParams = {
	id: number;
};

export const fetchEquipment = async ({ id }: FetchEquipmentParams) => {
	const { data } = await axios.get<EquipmentPreview>(`/equipment/${id}`);
	return data;
};
