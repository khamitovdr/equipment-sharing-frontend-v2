import { Button, CardActionArea, CardActions } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";

// import { useQuery } from "@tanstack/react-query";
// import { client } from "../api/Client";

export type EquipmentCategory = {
	id: number;
	name: string;
};

export type EquipmentPreview = {
	name: string;
	image: string;
	description: string;
	price: number;
	timeInterval: "ч." | "д." | "нед." | "мес." | "год.";
	category: EquipmentCategory;
};

type EquipmentCardProps = {
	equipment: EquipmentPreview;
};

// const fetchEquipmentList = async () => {
//     const { data } = await client.get<EquipmentPreview[]>("/equipment/");
//     return data;
// }

const EquipmentCard = ({ equipment }: EquipmentCardProps) => {
	const { name, image, description, price, timeInterval, category } = equipment;

	// const { isPending, isError, data: equipmentList, error } = useQuery({
	// 	queryKey: ["equipmentList"],
	// 	queryFn: fetchEquipmentList,
	// });

	return (
        // {isPending && <div>Loading...</div>}
        // {isError && <div>Error: {error.message}</div>}
        // {equipmentList && equipmentList.map((equipment) => (
        //     <div key={equipment.id}>{equipment.name}</div>
        // ))}
		<Card>
			<CardActionArea>
				<CardMedia component="img" height="300" image={image} alt={name} />
				<CardContent>
					<Typography gutterBottom variant="h5" component="div">
						{name}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{description}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Price: {price} / {timeInterval}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Category: {category.name}
					</Typography>
				</CardContent>
			</CardActionArea>
			<CardActions>
				<Button size="small" color="primary">
					Арендовать
				</Button>
			</CardActions>
		</Card>
	);
};

export default EquipmentCard;
