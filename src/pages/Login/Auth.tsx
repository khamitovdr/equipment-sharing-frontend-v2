import { Box, Button, Dialog, TextField } from "@mui/material";
import { useRef } from "react";
import { useAuthStore } from "../../stores/authStore";

const Auth = () => {

	const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
	const login = useAuthStore((state) => state.login);

	const usernameRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const username = usernameRef.current?.value;
		const password = passwordRef.current?.value;
		if (!username || !password) return;
		login({ username, password });
	};

	return (
		<Dialog open={!isAuthenticated}>
			<form onSubmit={onSubmit}>
				<Box p={4} display="flex" flexDirection="column" alignContent="center">
					<TextField
						inputRef={usernameRef}
						autoFocus
						margin="normal"
						label="Email"
						type="email"
						fullWidth
					/>
					<TextField
						inputRef={passwordRef}
						autoFocus
						margin="normal"
						id="password"
						label="Password"
						type="password"
						fullWidth
					/>
					<Button type="submit" variant="contained" sx={{ mt: 2 }}>
						Login
					</Button>
				</Box>
			</form>
		</Dialog>
	);
};

export default Auth;
