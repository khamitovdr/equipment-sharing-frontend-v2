import { client } from "./client";
import { AxiosError } from "axios";

export interface LoginRequest {
	readonly username: string;
	readonly password: string;
}

export class AuthService {
	async login(loginRequest: LoginRequest) {
		const params = new URLSearchParams(
			loginRequest as unknown as Record<string, string>,
		);

		try {
			const response = await client.post("/login/", params);
			return { token: response.data.access_token };
		} catch (error) {
			console.log(error);
			if ((error as AxiosError).response?.status === 401) {
				return { status: 401 };
			}
			throw error;
		}
	}
}
