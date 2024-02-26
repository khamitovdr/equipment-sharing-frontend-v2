import { useQuery } from "@tanstack/react-query";
import { fetchEquipmentList } from "src/api/equipment";
import useEquipmentCategory from "src/hooks/useEquipmentCategory";
import { useAuthStore } from "src/stores/authStore";
import EquipmentList from "src/widgets/EquipmentList";

const EquipmentForRent = () => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
	const { selectedCategory } = useEquipmentCategory();

	const {
		isPending,
		isError,
		data: equipmentList = [],
		error,
	} = useQuery({
		queryKey: ["equipmentList", { categoryId: selectedCategory }],
		queryFn: () => fetchEquipmentList({ category_id: selectedCategory }),
		enabled: isAuthenticated,
	});

	if (isError) {
		return <span>Error: {error.message}</span>;
	}

	return <EquipmentList {...{ equipmentList, isPending }} />;
};

export default EquipmentForRent;
