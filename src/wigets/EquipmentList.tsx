import EquipmentCard from "../wigets/EquipmentCard";
import { Grid, GridProps } from "@mui/material";
import { EquipmentPreview } from "../models/equipment";

const GridItem = ({
	children,
	...props
}: { children: React.ReactNode; props?: React.FC<GridProps> }) => {
	return (
		<Grid
			{...props}
			item
			xs={12}
			sm={6}
			md={4}
			lg={3}
			justifyContent="center"
			display="flex"
		>
			{children}
		</Grid>
	);
};

const EquipmentList = ({
	equipmentList,
	isPending,
}: { equipmentList: EquipmentPreview[]; isPending: boolean }) => {
	return (
		<Grid container spacing={3} sx={{ padding: "30px 0" }}>
			{isPending &&
				[...Array(12)].map((_, i) => (
					<GridItem
						// biome-ignore lint/suspicious/noArrayIndexKey: placeholder cards don't need a key
						key={i}
					>
						<EquipmentCard isLoading={true} />
					</GridItem>
				))}
			{equipmentList?.map((equipment) => (
				<GridItem key={equipment.id}>
					<EquipmentCard isLoading={false} equipment={equipment} />
				</GridItem>
			))}
		</Grid>
	);
};

export default EquipmentList;
