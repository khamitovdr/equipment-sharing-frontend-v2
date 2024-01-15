import MenuIcon from "@mui/icons-material/Menu";
import { Box } from "@mui/material";
import { IconButton, Menu } from "@mui/material/";
import { useDropdown } from "../../hooks/useDropdown";
import HeaderNavItem from "./HeaderNavItem";
import HeaderNavItemCollapsed from "./HeaderNavItemCollapsed";

const NAV_ITEMS: string[] = ["Как это рабтает?", "О нас", "Контакты"];

const MainPageHeaderNav = () => {
	const { anchorElement, handleOpen, handleClose } = useDropdown();

	return (
		<>
			<Box
				sx={{
					mr: 3,
					display: { xs: "none", md: "flex" },
				}}
			>
				{NAV_ITEMS.map((item) => (
					<HeaderNavItem key={item} text={item} />
				))}
			</Box>

			<Box sx={{ display: { xs: "flex", md: "none" } }}>
				<IconButton
					size="large"
					aria-label="account of current user"
					aria-controls="menu-appbar"
					aria-haspopup="true"
					onClick={handleOpen}
					color="inherit"
				>
					<MenuIcon />
				</IconButton>
				<Menu
					id="menu-appbar"
					anchorEl={anchorElement}
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "left",
					}}
					keepMounted
					transformOrigin={{
						vertical: "top",
						horizontal: "left",
					}}
					open={Boolean(anchorElement)}
					onClose={handleClose}
					sx={{
						display: { xs: "block", md: "none" },
					}}
				>
					{NAV_ITEMS.map((item) => (
						<HeaderNavItemCollapsed
							key={item}
							text={item}
							onClick={handleClose}
						/>
					))}
				</Menu>
			</Box>
		</>
	);
};

export default MainPageHeaderNav;
