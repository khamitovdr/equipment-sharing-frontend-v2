import { useQuery } from "@tanstack/react-query";
import { fetchEquipmentList } from "../api/equipment";
import EquipmentList from "./EquipmentList";

const EquipmentForRent = () => {
	const {
		isPending,
		isError,
		data: equipmentList = [],
		error,
	} = useQuery({
		queryKey: ["equipmentList"],
		queryFn: fetchEquipmentList,
	});

    if (isError) {
        return <span>Error: {error.message}</span>
      }

	return (
        <EquipmentList equipmentList={equipmentList} isPending={isPending}/>
	);
};

export default EquipmentForRent;
