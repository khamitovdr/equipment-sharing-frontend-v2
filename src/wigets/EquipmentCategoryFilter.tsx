import { Chip, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { fetchEquipmentCategories } from "../api/equipment";
import useEquipmentCategory from "../hooks/useEquipmentCategory";

const EquipmentCategoryFilter = () => {
	const { data: equipmentCategories = [] } = useQuery({
		queryKey: ["equipmentCategories"],
		queryFn: () => fetchEquipmentCategories({}),
	});

	const { selectedCategory, selectCategory, clearCategory } = useEquipmentCategory();

	return (
		<Stack direction="row" spacing={2}>
            <Chip
                color={!selectedCategory ? "primary" : "default"}
                label="Все категории"
                onClick={() => {
                    clearCategory();
                }}
            />
			{equipmentCategories.map((category) => (
				<Chip
					key={category.id}
					color={selectedCategory === category.id ? "primary" : "default"}
					label={category.name}
					onClick={() => {
						selectCategory(category.id);
					}}
				/>
			))}
		</Stack>
	);
};

export default EquipmentCategoryFilter;
