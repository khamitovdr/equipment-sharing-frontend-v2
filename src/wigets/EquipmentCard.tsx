import {
	Button,
	ButtonProps,
	CardActionArea,
	CardActions,
	Chip,
	Skeleton,
	Tooltip,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { EquipmentPreview } from "../models/equipment";
import { forwardRef } from "react";

const cardImageHeight = "260px";

const RentButton = (props: ButtonProps) => {
	return (
		<Button
			size="small"
			color="primary"
			style={{ flexGrow: 1 }}
			variant="contained"
			{...props}
		>
			Арендовать
		</Button>
	);
};

const CategoryChip = ({ name }: { name?: string }) => {
	return (
		<Chip
			label={name}
			variant="outlined"
			size="small"
			style={{ marginBottom: "10px" }}
		/>
	);
};

type EquipmentNameProps = {
	name?: string;
} & React.ComponentProps<typeof Typography>;

const EquipmentName = forwardRef(
	(props: EquipmentNameProps, ref: React.Ref<HTMLSpanElement>) => {
		const { name, ...childProps } = props;
		return (
			<Typography
				{...childProps}
				ref={ref}
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
				{name ? name : <Skeleton />}
			</Typography>
		);
	},
);

type EquipmentPriceProps =
	| {
			isSceleton: false;
			price: number;
			time_interval: string;
	  }
	| {
			isSceleton: true;
	  };

const EquipmentPrice = (props: EquipmentPriceProps) => {
	const { isSceleton } = props;
	return (
		<Typography variant="h5" color="primary" fontSize="1.3rem">
			{isSceleton ? (
				<Skeleton width="40%" />
			) : (
				`${props.price}₽/${props.time_interval}`
			)}
		</Typography>
	);
};

const CardLayout = ({
	media,
	children,
	actions,
}: {
	media: React.ReactNode;
	children: React.ReactNode;
	actions: React.ReactNode;
}) => {
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
				{media}
				<CardContent>{children}</CardContent>
			</CardActionArea>
			<CardActions style={{ display: "flex", justifyContent: "center" }}>
				{actions}
			</CardActions>
		</Card>
	);
};

type LoadingEquipmentCardProps = {
	isLoading: true;
};

type LoadedEquipmentCardProps = {
	isLoading: false;
	equipment: EquipmentPreview;
};

type EquipmentCardProps = LoadingEquipmentCardProps | LoadedEquipmentCardProps;

const EquipmentCard = (props: EquipmentCardProps) => {
	const { isLoading } = props;
	if (!isLoading) {
		const { equipment } = props;
		const { name, photo_and_video, price, time_interval, category } = equipment;
		const hasPhoto = photo_and_video.length > 0;
		const cardImageStyle = hasPhoto ? { objectFit: "contain" } : {};
		const avatar = hasPhoto
			? import.meta.env.VITE_API_URL + photo_and_video[0].derived_path.medium
			: "/equipment-card-placeholder.svg";

		return (
			<CardLayout
				media={
					<CardMedia
						component="img"
						height={cardImageHeight}
						image={avatar}
						alt={name}
						style={cardImageStyle as React.CSSProperties}
					/>
				}
				actions={<RentButton />}
			>
				<CategoryChip name={category.name} />
				<Tooltip title={name}>
					<EquipmentName name={name} />
				</Tooltip>
				<EquipmentPrice
					isSceleton={false}
					price={price}
					time_interval={time_interval}
				/>
			</CardLayout>
		);
	}

	return (
		<CardLayout
			media={<Skeleton variant="rectangular" height={cardImageHeight} />}
			actions={<RentButton disabled />}
		>
			<Skeleton width="70%">
				<CategoryChip />
			</Skeleton>

			<EquipmentName />

			<EquipmentPrice isSceleton={true} />
		</CardLayout>
	);
};

export default EquipmentCard;
