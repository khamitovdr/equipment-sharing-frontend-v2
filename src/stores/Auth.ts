import { makeAutoObservable } from "mobx";
import { AuthService, LoginRequest } from "../api/Auth";
import { jwtDecode } from 'jwt-decode';

export class AuthStore {
	private isAuth = false;

	constructor(private readonly authService: AuthService) {
		makeAutoObservable(this);

		const token = this.getToken();
		if (token) {
			this.setAuthenticated(true);
		}
	}

	private setAuthenticated(isAuth: boolean) {
		this.isAuth = isAuth;
	}

	async login(loginRequest: LoginRequest) {
		const response = await this.authService.login(loginRequest);
		const { status, token } = response as { status: number; token: string };

		if (status === 401) {
			this.setAuthenticated(false);
			return;
		}

		const decodedToken = jwtDecode(token) as { sub: string; exp: number };
		const tokenExp = String(decodedToken?.exp);

		console.log(decodedToken);
		localStorage.setItem("access_token", token);
		localStorage.setItem("token_exp", tokenExp);
		this.setAuthenticated(true);
	}

	getToken() {
		// Check if access_token and token_exp exists in localStorage, if yes, check if token is expired
		const token = localStorage.getItem("access_token");
		const tokenExp = localStorage.getItem("token_exp");
		if (token && tokenExp) {
			const now = new Date();
			const tokenExpDate = new Date(Number(tokenExp) * 1000);
			if (now > tokenExpDate) {
				// Token expired
                localStorage.removeItem("access_token");
                localStorage.removeItem("token_exp");
				this.setAuthenticated(false);
				return null;
			}
			return token;
		}
	}

	isAuthenicated() {
		return this.isAuth;
	}
}
