import {
	Avatar,
	Box,
	IconButton,
	Menu,
	MenuItem,
	Tooltip,
	Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useDropdown } from "../../hooks/useDropdown";

const USER_MENU_ITEMS = ["Profile", "Account", "Dashboard", "Logout"];

const MainPageHeaderProfile = () => {
	const { anchorElement, handleOpen, handleClose } = useDropdown();

	return (
		<Box sx={{ flexGrow: 0 }}>
			<Tooltip title="Open settings">
				<IconButton onClick={handleOpen} sx={{ p: 0 }}>
					<Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
				</IconButton>
			</Tooltip>
			<Menu
				sx={{ mt: "45px" }}
				id="menu-appbar"
				anchorEl={anchorElement}
				anchorOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				keepMounted
				transformOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				open={Boolean(anchorElement)}
				onClose={handleClose}
			>
				{USER_MENU_ITEMS.map((item, index) => (
					// <NavLink to={`/my-equipment/${index}`} key={item}>
					<MenuItem
						component={Link}
						to={`/my-equipment/${index}`}
						key={item}
						onClick={handleClose}
					>
						<Typography textAlign="center">{item}</Typography>
					</MenuItem>
					// </NavLink>
				))}
			</Menu>
		</Box>
	);
};

export default MainPageHeaderProfile;
