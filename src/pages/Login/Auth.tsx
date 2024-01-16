import { Box, Button, Dialog, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useRef, useContext } from "react";
import { StoreContext } from "../../storeContext";

const Auth = () => {
	const { authStore } = useContext(StoreContext);
	const isAuth = authStore.isAuthenicated();

	const usernameRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const username = usernameRef.current?.value;
		const password = passwordRef.current?.value;
		if (!username || !password) return;
		authStore.login({ username, password });
	};

	return (
		<Dialog open={!isAuth}>
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
					<Button
						type="submit"
						variant="contained"
						sx={{ mt: 2 }}
					>
						Login
					</Button>
				</Box>
			</form>
		</Dialog>
	);
};

export default observer(Auth);
