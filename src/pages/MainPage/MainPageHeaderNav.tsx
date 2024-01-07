import { Box } from "@mui/material";
import { IconButton, Menu } from "@mui/material/";
import MenuIcon from "@mui/icons-material/Menu";
import React from "react";
import HeaderNavItem from "./HeaderNavItem";
import HeaderNavItemCollapsed from "./HeaderNavItemCollapsed";

const NAV_ITEMS: string[] = ["Как это рабтает?", "О нас", "Контакты"];

const MainPageHeaderNav = () => {
	const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
		null,
	);

	const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorElNav(event.currentTarget);
	};

	const handleCloseNavMenu = () => {
		setAnchorElNav(null);
	};

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
					onClick={handleOpenNavMenu}
					color="inherit"
				>
					<MenuIcon />
				</IconButton>
				<Menu
					id="menu-appbar"
					anchorEl={anchorElNav}
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "left",
					}}
					keepMounted
					transformOrigin={{
						vertical: "top",
						horizontal: "left",
					}}
					open={Boolean(anchorElNav)}
					onClose={handleCloseNavMenu}
					sx={{
						display: { xs: "block", md: "none" },
					}}
				>
					{NAV_ITEMS.map((item) => (
						<HeaderNavItemCollapsed
							key={item}
							text={item}
							onClick={handleCloseNavMenu}
						/>
					))}
				</Menu>
			</Box>
		</>
	);
};

export default MainPageHeaderNav;
