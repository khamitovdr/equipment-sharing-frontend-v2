// import { client } from "./Client";
import { AxiosError } from "axios";

import axios from "axios";

// console.log(import.meta.env.VITE_API_URL);

export const client = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
});

export interface LoginRequest {
	readonly username: string;
	readonly password: string;
}

export class AuthService {
	async login(loginRequest: LoginRequest) {
		console.log(import.meta.env.VITE_API_URL);
		const params = new URLSearchParams(
			loginRequest as unknown as Record<string, string>,
		);
		try {
			const response = await client.post("/login/", params);
			// return response.data.access_token;
			return {
				status: response.status,
				token: response.data.access_token,
			};
		} catch (error) {
            console.log(error);
			if ((error as AxiosError).response?.status === 401) {
                console.log("401");
				return {
					status: 401,
                    token: "",
				};
			}
		}
	}
}
