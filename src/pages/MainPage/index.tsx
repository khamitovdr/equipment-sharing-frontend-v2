import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import EquipmentForRent from "src/pages/Rentals/EquipmentForRent";
import Slider from "src/widgets/Slider";
import MainPageHeader from "./MainPageHeader";
import Footer from "src/components/Footer";

const MainPage = () => {
	return (
		<Box display="flex" flexDirection="column" minHeight="100vh">
			<MainPageHeader />
			<Container maxWidth="lg" disableGutters sx={{ flex: 1 }}>
				<Slider />
				<EquipmentForRent />
			</Container>
			<Footer />
		</Box>
	);
};

export default MainPage;
