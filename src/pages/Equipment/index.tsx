import { Container } from "@mui/material";
import { useParams } from "react-router-dom";
import MediaViewer from "./MediaViewer";

const EquipmentPage = () => {
	const { id: equipmentId } = useParams();

	const images = [
		"https://via.placeholder.com/600x400.png?text=Image+1",
		"https://via.placeholder.com/600x400.png?text=Image+2",
		"https://via.placeholder.com/600x400.png?text=Image+3",
		"https://via.placeholder.com/600x400.png?text=Image+4",
	];

	return (
		<Container>
			<h1>Image Viewer Equipment {equipmentId} </h1>
			<MediaViewer images={images} />
		</Container>
	);
};

export default EquipmentPage;
