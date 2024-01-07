import { useQuery } from "@tanstack/react-query";
import { fetchEquipmentList } from "../../api/equipment";
import EquipmentList from "../../wigets/EquipmentList";
import { useOutletContext, useParams } from "react-router-dom";

const EquipmentForRent = () => {
	const { id } = useParams();

	let isEnabled = true;
	if (id) {
		const { isAuth } = useOutletContext() as { isAuth: boolean };
		isEnabled = isAuth;
	}

	const {
		isPending,
		isError,
		data: equipmentList = [],
		error,
	} = useQuery({
		queryKey: ["equipmentList", id],
		queryFn: fetchEquipmentList,
		enabled: isEnabled,
	});

	if (isError) {
		return <span>Error: {error.message}</span>;
	}

	return <EquipmentList equipmentList={equipmentList} isPending={isPending} />;
};

export default EquipmentForRent;
