import {
	Avatar,
	Box,
	Button,
	IconButton,
	Menu,
	MenuItem,
	Tooltip,
	Typography,
} from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDropdown } from "src/hooks/useDropdown";
import Auth from "src/pages/Login/Auth";
import { Routes } from "src/router/routes";
import { useAuthStore } from "src/stores/authStore";

const logout = () => {
	useAuthStore.getState().logOut();
};

const USER_MENU_ITEMS = [
	{ name: "Личный кабинет", path: Routes.Equipment },
	{ name: "Настройки", path: Routes.Settings },
];

const ProfileMenu = () => {
	const { anchorElement, handleOpen, handleClose } = useDropdown();

	return (
		<Box sx={{ flexGrow: 0 }}>
			<Tooltip title="Открыть меню">
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
				{USER_MENU_ITEMS.map((item) => (
					<MenuItem
						component={Link}
						to={item.path}
						key={item.path}
						onClick={handleClose}
					>
						<Typography textAlign="center">{item.name}</Typography>
					</MenuItem>
				))}
				<MenuItem
					key={-1}
					onClick={() => {
						handleClose();
						logout();
					}}
				>
					<Typography textAlign="center">Выйти</Typography>
				</MenuItem>
			</Menu>
		</Box>
	);
};

const LoginButton = () => {
	const [isClicked, setIsClicked] = useState(false);

	return (
		<>
			{isClicked && (
				<Auth open={isClicked} onClose={() => setIsClicked(false)} />
			)}
			<Box sx={{ flexGrow: 0 }}>
				<Button
					disableElevation
					variant="outlined"
					color="inherit"
					onClick={() => setIsClicked(true)}
				>
					Войти
				</Button>
			</Box>
		</>
	);
};

const MainPageHeaderProfile = () => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

	return isAuthenticated ? <ProfileMenu /> : <LoginButton />;
};

export default MainPageHeaderProfile;
