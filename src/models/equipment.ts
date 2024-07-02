import { Image, Document } from "./files";
import { Organization } from "./organizations";
import { UserDetail } from "./users";


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

export type EquipmentDetail = EquipmentPreview & {
	description: string;
	description_of_configuration: string;
	year_of_release: number;
	status: "published" | "hidden" | "archived";
	organization: Organization;
	added_by: UserDetail;
	created_at: Date;
	updated_at: Date;
	with_operator: boolean;
	on_owner_site: boolean;
	delivery: boolean;
	installation: boolean;
	setup: boolean;
	documents: Document[];
};
