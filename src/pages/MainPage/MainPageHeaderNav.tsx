import MenuIcon from "@mui/icons-material/Menu";
import { Box, Button, MenuItem, Typography } from "@mui/material";
import { IconButton, Menu } from "@mui/material/";
import { Link } from "react-router-dom";
import { useDropdown } from "src/hooks/useDropdown";
import { Routes } from "src/router/routes";

const NAV_ITEMS = [
	{ name: "Как это работает?", path: Routes.HowItWorks },
	{ name: "О нас", path: Routes.About },
	{ name: "Контакты", path: Routes.Contacts },
];

type HeaderNavItemProps = {
	text: string;
	to: Routes;
};

const HeaderNavItem = ({ text, to }: HeaderNavItemProps) => {
	return (
		<Button
			component={Link}
			to={to}
			sx={{ textTransform: "none", my: 2, color: "white", display: "block" }}
		>
			{text}
		</Button>
	);
};

type HeaderNavItemCollapsedProps = HeaderNavItemProps & {
	onClick: () => void;
};

const HeaderNavItemCollapsed = ({
	onClick,
	text,
	to,
}: HeaderNavItemCollapsedProps) => {
	return (
		<MenuItem onClick={onClick} component={Link} to={to}>
			<Typography textAlign="center">{text}</Typography>
		</MenuItem>
	);
};

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
					<HeaderNavItem key={item.name} text={item.name} to={item.path} />
				))}
			</Box>

			<Box sx={{ display: { xs: "flex", md: "none" } }}>
				<IconButton
					size="large"
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
							key={item.name}
							text={item.name}
							to={item.path}
							onClick={handleClose}
						/>
					))}
				</Menu>
			</Box>
		</>
	);
};

export default MainPageHeaderNav;
