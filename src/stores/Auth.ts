import { makeAutoObservable } from "mobx";
import { AuthService, LoginRequest } from "../api/auth";

export class AuthStore {
	private token: string | null = null;

	isAuthenicated() {
		return !!this.token;
	}

	constructor(private readonly authService: AuthService) {
		makeAutoObservable(this);
		this.getToken();
	}

	async login(loginRequest: LoginRequest) {
		const response = await this.authService.login(loginRequest);
		const { status, token } = response as {
			status: number | undefined;
			token: string;
		};

		if (status && status === 401) {
			this.logOut();
			return;
		}

		localStorage.setItem("access_token", token);
		this.getToken();
	}

	getToken() {
		if (!this.token) {
			const token = localStorage.getItem("access_token");
			this.token = token;
		}
		return this.token;
	}

	logOut() {
		localStorage.removeItem("access_token");
		this.token = null;
	}
}
