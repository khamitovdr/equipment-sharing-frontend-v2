import { Box, Button, Dialog, Divider } from "@mui/material";
import { Link } from "react-router-dom";
import LoginForm from "../../forms/authForm";
import { Routes } from "../../router/routes";
import { useAuthStore } from "../../stores/authStore";

type AuthProps =
	| {
			isObligatory: true;
	  }
	| (React.ComponentProps<typeof Dialog> & { isObligatory?: false });

const Auth = (props: AuthProps) => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

	const { isObligatory, ...rest } = props;

	return (
		<Dialog
			sx={{
				"& .MuiDialog-paper": {
					width: "100%",
					maxWidth: "360px",
					minWidth: "300px",
					maxHeight: "100%",
					overflow: "auto",
				},
			}}
			open={!isAuthenticated}
			{...rest}
		>
			<LoginForm />

			<Box
				p={4}
				paddingTop={0}
				display="flex"
				flexDirection="column"
				alignContent="center"
			>
				<Divider variant="middle" sx={{ mt: 2 }}>
					Ещё нет аккаунта?
				</Divider>
				<Button
					component={Link}
					to={Routes.Signup}
					variant="outlined"
					sx={{ mt: 2 }}
					size="large"
					fullWidth
				>
					Зарегистрироваться
				</Button>
			</Box>
		</Dialog>
	);
};

export default Auth;
