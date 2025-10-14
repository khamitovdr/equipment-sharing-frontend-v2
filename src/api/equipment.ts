import axios from "axios";
import { EquipmentCategory, EquipmentPreview, EquipmentDetail } from "src/models/equipment";

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
	const { data } = await axios.get<EquipmentDetail>(`/equipment/${id}/`);
	return data;
};

// Orders (renter)
type CreateOrderParams = {
    equipment_id: number;
    start_date: string; // ISO date YYYY-MM-DD
    end_date: string;   // ISO date YYYY-MM-DD
};

export const createOrder = async (payload: CreateOrderParams) => {
    const { data } = await axios.post("/renter/orders/", payload);
    return data;
};
