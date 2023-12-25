import { MenuItem, Typography } from "@mui/material/";

type HeaderNavItemProps = {
	onClick: () => void;
	text: string;
};

const HeaderNavItemCollapsed = ({ onClick, text }: HeaderNavItemProps) => {
	return (
		<MenuItem onClick={onClick}>
			<Typography textAlign="center">{text}</Typography>
		</MenuItem>
	);
};

export default HeaderNavItemCollapsed;
