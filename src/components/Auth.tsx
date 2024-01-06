import { Box, Button, Dialog, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useContext } from "react";
import { StoreContext } from "../storeContext";

const Auth = () => {
	const { authStore } = useContext(StoreContext);
	const isAuth = authStore.isAuthenicated();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	return (
		<Dialog open={!isAuth}>
			<Box p={4} display="flex" flexDirection="column" alignContent="center">
				<TextField
					autoFocus
					margin="normal"
					label="Email"
					type="email"
					fullWidth
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>
				<TextField
					autoFocus
					margin="normal"
					id="password"
					label="Password"
					type="password"
					fullWidth
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<Button
					onClick={() => {
						authStore.login({ username, password });
					}}
					variant="contained"
					sx={{ mt: 2 }}
				>
					Login
				</Button>
			</Box>
		</Dialog>
	);
};

export default observer(Auth);
