import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const usePathState = (
	state: Record<string, string | undefined>
) => {
	const navigate = useNavigate();
	const { search } = useLocation();

	const searchParams = new URLSearchParams(search);
	const pathState = Object.fromEntries(searchParams);

	const setPathState = (key: string, value: string) => {
		searchParams.set(key, value);
		navigate({ search: searchParams.toString() });
	};

	const removePathState = (key: string) => {
		searchParams.delete(key);
		navigate({ search: searchParams.toString() });
	};

	useEffect(() => {
		const newState = { ...state, ...pathState };
		const newSearchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(newState)) {
			if (value) {
				newSearchParams.set(key, value);
			}
		}
		navigate({ search: newSearchParams.toString() });
	}, []);

	return { pathState, setPathState, removePathState };
};
