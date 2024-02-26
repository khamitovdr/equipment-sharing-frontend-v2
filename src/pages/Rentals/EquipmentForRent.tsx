import { useQuery } from "@tanstack/react-query";
import { fetchEquipmentList } from "src/api/equipment";
import useEquipmentCategory from "src/hooks/useEquipmentCategory";
import EquipmentList from "src/widgets/EquipmentList";

const EquipmentForRent = () => {
	const { selectedCategory } = useEquipmentCategory();

	const {
		isPending,
		isError,
		data: equipmentList = [],
		error,
	} = useQuery({
		queryKey: ["equipmentList", { categoryId: selectedCategory }],
		queryFn: () => fetchEquipmentList({ category_id: selectedCategory }),
	});

	if (isError) {
		return <span>Error: {error.message}</span>;
	}

	return <EquipmentList {...{ equipmentList, isPending }} />;
};

export default EquipmentForRent;
