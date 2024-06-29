import { Box, Grid, GridProps } from "@mui/material";
import EmptyPlaceholder from "src/components/ui/EmptyPlaceholder";
import { EquipmentPreview } from "src/models/equipment";
import EquipmentCard from "./EquipmentCard";
import EquipmentCategoryFilter from "./EquipmentCategoryFilter";

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
		<Box m={4}>
			<EquipmentCategoryFilter />
			<Grid container spacing={3} mt={0}>
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
			{!isPending && Array.isArray(equipmentList) && !equipmentList.length && (
				<EmptyPlaceholder />
			)}
		</Box>
	);
};

export default EquipmentList;
