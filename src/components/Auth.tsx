import React, { useContext, useState } from "react";
import { observer } from "mobx-react-lite";
import { StoreContext } from "../storeContext";
import { Box, Dialog, TextField, Button } from "@mui/material";

const Auth: React.FC = () => {
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
				<Button onClick={() => {console.log("login");
                     authStore.login({username, password})}} variant="contained" sx={{ mt: 2 }}>
					Login
				</Button>
			</Box>
		</Dialog>
	);
};

export default observer(Auth);
