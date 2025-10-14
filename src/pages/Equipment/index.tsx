import {
	Box,
	Chip,
	Container,
	Divider,
	Grid,
	Paper,
	Stack,
	Typography,
	Button,
} from "@mui/material";
import { Link, useParams } from "react-router-dom";
import MediaViewer from "./MediaViewer";
import { useQuery } from "@tanstack/react-query";
import { fetchEquipment } from "src/api/equipment";
import { Routes } from "src/router/routes";
import PersonIcon from "@mui/icons-material/Person";
import HandymanIcon from "@mui/icons-material/Handyman";
import SettingsIcon from "@mui/icons-material/Settings";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";

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

	const intervalToShortRu: Record<string, string> = {
		hour: "ч",
		day: "день",
		week: "нед",
		month: "мес",
		year: "год",
	};

	const organizationName =
		equipment.organization?.short_name ||
		equipment.organization?.full_name ||
		`ИНН ${equipment.organization?.inn}`;

	const OptionChip = ({
		icon,
		label,
		active,
	}: {
		icon: React.ReactNode;
		label: string;
		active: boolean;
	}) => (
		<Chip
			icon={icon as React.ReactElement}
			label={label}
			variant={active ? "filled" : "outlined"}
			color={active ? "primary" : undefined}
		/>
	);

	return (
		<Container sx={{ py: { xs: 2, md: 4 } }}>
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<Typography variant="h5" sx={{ fontWeight: 600 }}>
						{equipment.name}
					</Typography>
				</Grid>

				{/* Left: media and details */}
				<Grid item xs={12} md={8}>
					<MediaViewer images={equipment.photo_and_video} />

					{/* Thumbs are inside MediaViewer; below we show description sections */}
					<Box mt={3}>
						<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
							<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
								Состояние и комплектация
							</Typography>
							<Stack spacing={0.5}>
								{equipment.year_of_release && (
									<Typography variant="body2">Год выпуска – {equipment.year_of_release}</Typography>
								)}
								{equipment.description_of_configuration && (
									<Typography variant="body2">
										{equipment.description_of_configuration}
									</Typography>
								)}
								{equipment.description && (
									<Typography variant="body2" color="text.secondary">
										{equipment.description}
									</Typography>
								)}
							</Stack>
						</Paper>

						<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
							<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
								Организация
							</Typography>
							<Typography variant="body2">{organizationName}</Typography>
						</Paper>

						<Grid container spacing={2}>
							<Grid item xs={12} md={6}>
								<Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
									<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
										Опции
									</Typography>
									<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
										<OptionChip icon={<PersonIcon />} label="С машинистом/оператором" active={equipment.with_operator} />
										<OptionChip icon={<HandymanIcon />} label="Установка оборудования" active={equipment.installation} />
										<OptionChip icon={<SettingsIcon />} label="Настройка оборудования" active={equipment.setup} />
									</Stack>
								</Paper>
							</Grid>
							<Grid item xs={12} md={6}>
								<Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
									<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
										Способ получения
									</Typography>
									<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
										<OptionChip icon={<LocalShippingIcon />} label="Доставка" active={equipment.delivery} />
										<OptionChip icon={<StorefrontIcon />} label="Самовывоз" active={!equipment.delivery} />
									</Stack>
									<Divider sx={{ my: 2 }} />
									<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
										Форма аренды
									</Typography>
									<Typography variant="body2">
										{equipment.on_owner_site
											? "На территории арендодателя"
											: "На территории арендатора"}
									</Typography>
								</Paper>
							</Grid>
						</Grid>
					</Box>
				</Grid>

				{/* Right: price card */}
				<Grid item xs={12} md={4}>
					<Paper elevation={3} sx={{ p: 2, position: "sticky", top: { md: 24 }, mb: 2 }}>
						<Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
							{equipment.price.toLocaleString("ru-RU")} руб / {intervalToShortRu[equipment.time_interval] || equipment.time_interval}
						</Typography>
						<Button
							component={Link}
							to={`${Routes.Rentals}/${equipmentId}`}
							variant="contained"
							size="large"
							fullWidth
							sx={{ mt: 2 }}
						>
							Арендовать
						</Button>
					</Paper>
				</Grid>
			</Grid>
		</Container>
	);
};

export default EquipmentPage;
