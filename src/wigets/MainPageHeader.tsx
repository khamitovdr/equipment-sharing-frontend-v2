import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import HeaderLogo from "../components/HeaderLogo";
import MainPageHeaderNav from "./MainPageHeaderNav";
import MainPageHeaderProfile from "./MainPageHeaderProfile";

const MainPageHeader = () => {
	return (
		<AppBar position="static">
			<Container maxWidth="lg">
				<Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
					<HeaderLogo />
					<Box sx={{ flexGrow: 1 }} />
					<MainPageHeaderNav />
					<MainPageHeaderProfile />
				</Toolbar>
			</Container>
		</AppBar>
	);
};

export default MainPageHeader;
