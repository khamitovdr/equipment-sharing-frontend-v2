export interface LoginRequest {
	readonly username: string;
	readonly password: string;
}

export class AuthService {
    async login(loginRequest: LoginRequest) {
        const uri = `${import.meta.env.VITE_BACKEND_URL}login/`;
        const response = await fetch(uri, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(loginRequest as unknown as Record<string, string>),
            // mode: "no-cors", // Add this line
        });

        const parsedResponse = await response.json();

        if (response.ok) {
            // localStorage.setItem("access_token", parsedResponse.data.access_token);
            console.log(parsedResponse.access_token);
            return parsedResponse.access_token;
        }
        console.log(parsedResponse.message);
        throw new Error(parsedResponse.message);
    }
}
