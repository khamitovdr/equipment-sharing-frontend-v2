import axios from "axios";
import { create } from "zustand";
import { UserData, UserDataSchema } from "../models/SignUp";

const ValidateUserData = (userData: UserData) => {
	const result = UserDataSchema.safeParse(userData);
	if (!result.success) {
		throw new Error("UserData validation failed");
	}
	return result.data;
};

type UserStore = {
	userData: UserData;
	updateUserData: (newData: Partial<UserData>) => void;
	submitUserData: () => Promise<void>;
};

export const useUserStore = create<UserStore>((set, get) => ({
	userData: {
		is_owner: false,
		name: "",
		middle_name: "",
		surname: "",
		email: "",
		password: "",
		phone: "",
		organization_inn: "",
	},
	updateUserData: (newData) => {
		set((state) => ({
			userData: {
				...state.userData,
				...newData,
			},
		}));
	},
	submitUserData: async () => {
		const { userData } = get();
		const validatedUserData = ValidateUserData(userData);
		const response = await axios.post("/users/", validatedUserData);
		return response.data;
	},
}));
