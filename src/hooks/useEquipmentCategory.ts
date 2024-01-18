import { useSearchParams } from "react-router-dom";

const useEquipmentCategory = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const selectedCategory =
		parseInt(searchParams.get("category") || "") || undefined;

	const selectCategory = (categoryId: number) => {
		setSearchParams(
			(params) => {
				params.set("category", categoryId.toString());
				return params;
			},
			{
				replace: true,
			},
		);
	};

	const clearCategory = () => {
		setSearchParams(
			(params) => {
				params.delete("category");
				return params;
			},
			{
				replace: true,
			},
		);
	};

	return { selectedCategory, selectCategory, clearCategory };
};

export default useEquipmentCategory;
