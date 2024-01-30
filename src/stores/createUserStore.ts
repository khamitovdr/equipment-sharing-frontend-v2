import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserData, UserDataSchema } from "../models/SignUp";
import { useAuthStore } from "./authStore";

const ValidateUserData = (userData: UserData) => {
	const result = UserDataSchema.safeParse(userData);
	if (!result.success) {
		throw new Error("UserData validation failed");
	}
	return result.data;
};

type SignupStore = {
	userData: UserData;
	updateUserData: (newData: Partial<UserData>) => void;
	submitUserData: () => Promise<void>;
	reset: () => void;
};

const defaultState = {
	userData: {
		is_owner: false,
		name: "",
		middle_name: "",
		surname: "",
		email: "",
		password: "",
		phone: "",
		organization_inn: "",
		organization_data: null,
	},
};

export const useSignupStore = create<SignupStore>()(
	persist(
		(set, get) => ({
			...defaultState,
			updateUserData: (newData) => {
				set((state) => ({
					userData: {
						...state.userData,
						...newData,
					},
				}));
			},
			submitUserData: async () => {
				const { userData, reset } = get();
				const validatedUserData = ValidateUserData(userData);
				const response = await axios.post("/users/", validatedUserData);
				if (response.status === 201) {
					const login = useAuthStore.getState().login;
					await login({
						username: userData.email,
						password: userData.password,
					});
					reset();
				}
			},
			reset: () => {
				useSignupStore.persist.clearStorage();
				set(defaultState);
			},
		}),
		{
			name: "signup-storage",
		},
	),
);
