import Container from "@mui/material/Container";
import EquipmentForRent from "src/pages/Rentals/EquipmentForRent";
import MainPageHeader from "./MainPageHeader";

const MainPage = () => {
	return (
		<>
			<MainPageHeader />
			<Container maxWidth="lg">
				<EquipmentForRent />
			</Container>
		</>
	);
};

export default MainPage;
