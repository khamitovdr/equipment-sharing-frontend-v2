import { useQuery } from "@tanstack/react-query";
import { fetchEquipmentList } from "../../api/equipment";
import { useAuthStore } from "../../stores/authStore";
import EquipmentList from "../../wigets/EquipmentList";

const EquipmentForRent = () => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

	const {
		isPending,
		isError,
		data: equipmentList = [],
		error,
	} = useQuery({
		queryKey: ["equipmentList"],
		queryFn: fetchEquipmentList,
		enabled: isAuthenticated,
	});

	if (isError) {
		return <span>Error: {error.message}</span>;
	}

	return <EquipmentList equipmentList={equipmentList} isPending={isPending} />;
};

export default EquipmentForRent;
