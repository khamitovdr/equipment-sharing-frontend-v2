import HomeIcon from "@mui/icons-material/Home";
import { Button, Container, Divider } from "@mui/material";
import { Link, Navigate, Outlet, useParams } from "react-router-dom";
import { Routes } from "../../router/routes";

const SignUp = () => {
	const { step } = useParams();

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
			{step ? <Outlet /> : <Navigate to="./name-email" />}

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
