import axios, { AxiosError } from "axios";
import { create } from "zustand";

export type LoginRequest = {
	username: string;
	password: string;
};

const fetchAuthToken = async (loginRequest: LoginRequest) => {
	const params = new URLSearchParams(loginRequest);

	try {
		const response = await axios.post("/login/", params);
		return { token: response.data.access_token };
	} catch (error) {
		console.log(error);

		switch ((error as AxiosError).response?.status) {
			case 401:
				console.log("401");
				break;
			case 403:
				console.log("422");
				break;
			default:
				throw error;
		}
	}
};

type AuthStore = {
	token: string | null;
	isAuthenticated: () => boolean;
	login: (loginRequest: LoginRequest) => void;
	logOut: () => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
	token: null,
	isAuthenticated: () => !!get().token,
	login: async (loginRequest: LoginRequest): Promise<void> => {
		const result = await fetchAuthToken(loginRequest);
		if (!result) {
			return;
		}
		const { token } = result;
		set({ token });
		localStorage.setItem("token", token);
		axios.defaults.headers.common.Authorization = `Bearer ${token}`;
	},
	logOut: () => {
		set({ token: null });
		localStorage.removeItem("token");
		axios.defaults.headers.common.Authorization = undefined;
	},
}));
