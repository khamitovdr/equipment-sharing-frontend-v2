import HomeIcon from "@mui/icons-material/Home";
import { Button, Container, Divider } from "@mui/material";
import { Link } from "react-router-dom";
import SignUpForm from "../../forms/signUpForm";
import { Routes } from "../../router/routes";
import { useSignupStore } from "../../stores/createUserStore";

const SignUp = () => {
	const userData = useSignupStore((state) => state.userData);
	const updateUserData = useSignupStore((state) => state.updateUserData);
	const submitUserData = useSignupStore((state) => state.submitUserData);

	return (
		<Container
			maxWidth="sm"
			sx={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "stretch",
			}}
		>
			<SignUpForm
				userData={userData}
				updateUserData={updateUserData}
				submitUserData={submitUserData}
			/>

			<Divider variant="middle" sx={{ mt: 3, mb: 4 }} />

			<Button
				component={Link}
				to={Routes.Home}
				variant="outlined"
				sx={{ mb: 2 }}
				size="large"
				fullWidth
				startIcon={<HomeIcon />}
			>
				На главную
			</Button>
		</Container>
	);
};

export default SignUp;
