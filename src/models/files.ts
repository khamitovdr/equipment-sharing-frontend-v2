type PhotoDerivatives = {
	webp: string;
	large: string;
	small: string;
	medium: string;
};

export type File = {
	id: number;
	name: string;
	media_type: string;
	media_format: string;
	path: string;
	added_by_id: number;
};

export type Image = File & {
	derived_path: PhotoDerivatives;
};

export type Document = File;
