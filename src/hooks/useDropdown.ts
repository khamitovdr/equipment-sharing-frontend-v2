import { useState } from "react";

export const useDropdown = (
	initialAnchorElement: HTMLElement | null = null,
) => {
	const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(
		initialAnchorElement,
	);

	const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorElement(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorElement(null);
	};

	return {
		anchorElement,
		handleOpen,
		handleClose,
	};
};
