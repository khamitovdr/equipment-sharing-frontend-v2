import Container from "@mui/material/Container";
import EquipmentForRent from "src/pages/Rentals/EquipmentForRent";
import Slider from "src/widgets/Slider";
import MainPageHeader from "./MainPageHeader";

const MainPage = () => {
	return (
		<>
			<MainPageHeader />
			<Container maxWidth="lg" disableGutters>
				<Slider />
				<EquipmentForRent />
			</Container>
		</>
	);
};

export default MainPage;
