import MainPageHeader from "../wigets/MainPageHeader";
import EquipmentForRent from "../wigets/EquipmentForRent";
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
