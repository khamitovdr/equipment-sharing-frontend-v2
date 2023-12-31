import MainPageHeader from "../wigets/MainPageHeader";
import EquipmentCard, { EquipmentPreview } from "../wigets/EquipmentCard";
import { Grid } from "@mui/material";

const equipmentList: EquipmentPreview[] = [
	{
		name: "Компрессор",
		image:
			"https://img.techelement.ru/dflkjDFGddf5rfsdGDFggdfg/plain/https://techelement.ru/content/files/catalog1/source/121580473_w640_h640_img270_73204_big_1443190218.jpg",
		description: "Компрессор для накачки шин",
		price: 1000,
		timeInterval: "ч.",
		category: {
			id: 1,
			name: "Компрессоры",
		},
	},
	{
		name: "Бетономешалка",
		image: "https://cdn1.ozone.ru/s3/multimedia-e/6493462670.jpg",
		description: "Бетономешалка для замешивания бетона",
		price: 1000,
		timeInterval: "ч.",
		category: {
			id: 2,
			name: "Бетономешалки",
		},
	},
	{
		name: "Бензопила",
		image:
			"https://avatars.mds.yandex.net/get-mpic/4725270/img_id5815585739801640544.jpeg/orig",
		description: "Бензопила для распиливания деревьев",
		price: 1000,
		timeInterval: "ч.",
		category: {
			id: 3,
			name: "Бензопилы",
		},
	},
];

const MainPage = () => {
	return (
		<>
			<MainPageHeader />
			<Grid container spacing={3} sx={{ padding: "30px" }}>
				{equipmentList.map((equipment) => (
					<Grid item xs={12} sm={6} md={4} key={equipment.name} >
						<EquipmentCard equipment={equipment} />
					</Grid>
				))}
			</Grid>
		</>
	);
};

export default MainPage;
