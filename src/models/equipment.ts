import { Image } from "./files";

export type EquipmentCategory = {
	id: number;
	name: string;
};

export type EquipmentPreview = {
	id: number;
	name: string;
	photo_and_video: Image[];
	price: number;
	time_interval: string;
	category: EquipmentCategory;
};
