import { useQuery } from "@tanstack/react-query";
import { fetchEquipmentList } from "../../api/equipment";
import { useAuthStore } from "../../stores/authStore";
import EquipmentList from "../../wigets/EquipmentList";
import useEquipmentCategory from "../../hooks/useEquipmentCategory";

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
