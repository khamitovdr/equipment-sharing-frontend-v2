import MainPageHeader from "./MainPageHeader";
import EquipmentForRent from "../Rentals/EquipmentForRent";
import Container from "@mui/material/Container";

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
