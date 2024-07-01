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
import { forwardRef } from "react";
import { EquipmentPreview } from "src/models/equipment";
import { Link } from "react-router-dom";
import { Routes } from "src/router/routes";

const cardImageHeight = "260px";

type RentButtonProps = {
	equipmentId: number;
} & ButtonProps;

const RentButton = (props: RentButtonProps) => {
	const { equipmentId, ...rest } = props;

	return (
		<Button
			size="small"
			color="primary"
			style={{ flexGrow: 1 }}
			variant="contained"
			component={Link}
			to={`${Routes.Rentals}/${equipmentId}`}
			{...rest}
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
			isSkeleton: false;
			price: number;
			time_interval: string;
	  }
	| {
			isSkeleton: true;
	  };

const EquipmentPrice = (props: EquipmentPriceProps) => {
	const { isSkeleton } = props;
	return (
		<Typography variant="h5" color="primary" fontSize="1.3rem">
			{isSkeleton ? (
				<Skeleton width="40%" />
			) : (
				`${props.price}₽/${props.time_interval}`
			)}
		</Typography>
	);
};

type CardLayoutProps = {
	equipmentId?: number;
	media: React.ReactNode;
	children: React.ReactNode;
	actions?: React.ReactNode;
};

const CardLayout = ({
	equipmentId,
	media,
	children,
	actions,
}: CardLayoutProps) => {
	const ActionAreaProps = equipmentId
		? { component: Link, to: `${Routes.Equipment}/${equipmentId}` }
		: {};

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
			<CardActionArea {...ActionAreaProps}>
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
		const { id, name, photo_and_video, price, time_interval, category } =
			equipment;
		const hasPhoto = photo_and_video.length > 0;
		const cardImageStyle = hasPhoto ? { objectFit: "contain" } : {};
		const avatar = hasPhoto
			? import.meta.env.VITE_API_URL + photo_and_video[0].derived_path.medium
			: "/equipment-card-placeholder.svg";

		return (
			<CardLayout
				equipmentId={id}
				media={
					<CardMedia
						component="img"
						height={cardImageHeight}
						image={avatar}
						alt={name}
						style={cardImageStyle as React.CSSProperties}
					/>
				}
				actions={<RentButton equipmentId={id} />}
			>
				<CategoryChip name={category.name} />
				<Tooltip title={name}>
					<EquipmentName name={name} />
				</Tooltip>
				<EquipmentPrice
					isSkeleton={false}
					price={price}
					time_interval={time_interval}
				/>
			</CardLayout>
		);
	}

	return (
		<CardLayout
			media={<Skeleton variant="rectangular" height={cardImageHeight} />}
			// actions={<RentButton disabled />}
		>
			<Skeleton width="70%">
				<CategoryChip />
			</Skeleton>

			<EquipmentName />

			<EquipmentPrice isSkeleton={true} />
		</CardLayout>
	);
};

export default EquipmentCard;
