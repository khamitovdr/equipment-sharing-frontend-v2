import {
	Button,
	CardActionArea,
	CardActions,
	Tooltip,
	Chip,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { EquipmentPreview } from "../models/equipment";

type EquipmentCardProps = {
	equipment: EquipmentPreview;
};

const EquipmentCard = ({ equipment }: EquipmentCardProps) => {
	const { name, photo_and_video, price, time_interval, category } = equipment;
	const avatar = photo_and_video.length
		? import.meta.env.VITE_API_URL + photo_and_video[0].derived_path.medium
		: "https://via.placeholder.com/300";

	return (
		<Card
			sx={{
				height: "100%",
				width: "100%",
				maxWidth: "380px",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
			}}
			elevation={3}
		>
			<CardActionArea>
				<CardMedia
					component="img"
					height="260px"
					image={avatar}
					alt={name}
					style={{ objectFit: "contain" }}
				/>
				<CardContent>
					<Chip
						label={category.name}
						variant="outlined"
						size="small"
						style={{ marginBottom: "10px" }}
					/>
					<Tooltip title={name}>
						<Typography
							gutterBottom
							variant="h6"
							style={{
								fontSize: "1rem",
								overflow: "hidden",
								textOverflow: "ellipsis",
								display: "-webkit-box",
								WebkitLineClamp: 2,
								WebkitBoxOrient: "vertical",
								lineHeight: "1.4em", // Adjust line height as needed
								maxHeight: "3em", // Line height multiplied by number of lines
							}}
						>
							{name}
						</Typography>
					</Tooltip>
					<Typography variant="h5" color="primary" fontSize="1.3rem">
						{price}₽/{time_interval}
					</Typography>
				</CardContent>
			</CardActionArea>
			<CardActions style={{ display: "flex", justifyContent: "center" }}>
				<Button
					size="small"
					color="primary"
					style={{ flexGrow: 1 }}
					variant="contained"
				>
					Арендовать
				</Button>
			</CardActions>
		</Card>
	);
};

export default EquipmentCard;
