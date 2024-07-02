import { Container } from "@mui/material";
import { useParams } from "react-router-dom";
import MediaViewer from "./MediaViewer";
import { useQuery } from "@tanstack/react-query";
import { fetchEquipment } from "src/api/equipment";

const EquipmentPage = () => {
	const { id: equipmentIdStr } = useParams();

	if (!equipmentIdStr) {
		// TODO: Redirect to 404 page
		return <span>Equipment ID is required</span>;
	}

	// Convert the equipmentId to a number
	const equipmentId = Number(equipmentIdStr);

	const {
		isPending,
		isError,
		data: equipment,
		error,
	} = useQuery({
		queryKey: ["equipmentDetail", { id: equipmentId }],
		queryFn: () => fetchEquipment({ id: equipmentId }),
	});

	if (isError) {
		return <span>Error: {error.message}</span>;
	}

	if (isPending) {
		return <span>Loading...</span>;
	}

	// const images = [
	// 	"https://via.placeholder.com/600x400.png?text=Image+1",
	// 	"https://via.placeholder.com/600x400.png?text=Image+2",
	// 	"https://via.placeholder.com/600x400.png?text=Image+3",
	// 	"https://via.placeholder.com/600x400.png?text=Image+4",
	// ];

	return (
		<Container>
			<h1>Image Viewer Equipment {equipmentId} </h1>
			<p>{JSON.stringify(equipment)}</p>
			<MediaViewer images={equipment.photo_and_video} />
		</Container>
	);
};

export default EquipmentPage;
