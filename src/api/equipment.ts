import { client } from "./client";
import { EquipmentPreview } from "../models/equipment";

export const fetchEquipmentList = async () => {
	const { data } = await client.get<EquipmentPreview[]>("/equipment/");
	return data;
};
