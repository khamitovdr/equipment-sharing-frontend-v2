import { Button } from "@mui/material";

const HeaderNavItem = ({ text }: { text: string }) => {
    return (
		<Button
			sx={{ textTransform: "none", my: 2, color: "white", display: "block" }}
		>
			{text}
		</Button>
	);
};

export default HeaderNavItem;
