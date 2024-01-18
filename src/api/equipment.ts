import axios from "axios";
import { EquipmentPreview } from "../models/equipment";

export const fetchEquipmentList = async () => {
	const { data } = await axios.get<EquipmentPreview[]>("/equipment/");
	return data;
};
