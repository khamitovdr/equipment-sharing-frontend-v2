import EquipmentCard from "../wigets/EquipmentCard";
import { Grid } from "@mui/material";
import { EquipmentPreview } from "../models/equipment";

const EquipmentList = ({
	equipmentList,
	isPending,
}: { equipmentList: EquipmentPreview[]; isPending: boolean }) => {
	return (
		<Grid container spacing={3} sx={{ padding: "30px 0" }}>
			{isPending && <div>Loading...</div>}
			{equipmentList?.map((equipment) => (
				<Grid
					item
					xs={12}
					sm={6}
					md={4}
					lg={3}
					key={equipment.id}
					justifyContent="center"
					display="flex"
				>
					<EquipmentCard equipment={equipment} />
				</Grid>
			))}
		</Grid>
	);
};

export default EquipmentList;
