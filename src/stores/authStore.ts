import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LoginRequest = {
	username: string;
	password: string;
};

const fetchAuthToken = async (loginRequest: LoginRequest) => {
	const params = new URLSearchParams(loginRequest);

	const response = await axios.post("/login/", params);
	return { token: response.data.access_token };
};

type AuthStore = {
	token: string | null;
	isAuthenticated: () => boolean;
	login: (loginRequest: LoginRequest) => void;
	logOut: () => void;
};

export const useAuthStore = create<AuthStore>()(
	persist(
		(set, get) => ({
			token: null,
			isAuthenticated: () => !!get().token,
			login: async (loginRequest: LoginRequest): Promise<void> => {
				const result = await fetchAuthToken(loginRequest);
				if (!result) {
					return;
				}
				const { token } = result;
				set({ token });
				axios.defaults.headers.common.Authorization = `Bearer ${token}`;
			},
			logOut: () => {
				set({ token: null });
				axios.defaults.headers.common.Authorization = undefined;
			},
		}),
		{
			name: "auth-storage",
			onRehydrateStorage: () => {
				return (state) => {
					if (!state?.token) {
						return;
					}
					axios.defaults.headers.common.Authorization = `Bearer ${state.token}`;
				};
			},
		},
	),
);
