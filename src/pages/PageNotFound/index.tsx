import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MainPageHeader from "src/pages/MainPage/MainPageHeader";

const NotFoundPage = () => {
	const navigate = useNavigate();

	const isPreviousPageFromSameDomain = () => {
		// Check if there's a previous page
		if (window.history.length > 1) {
			const referrer = document.referrer;
			const currentDomain = window.location.origin;

			// Check if the referrer is from the same domain
			if (referrer.startsWith(currentDomain)) {
				return true;
			}
		}
		return false;
	};

	return (
		<>
			<MainPageHeader />
			<Container
				maxWidth="lg"
				style={{ marginTop: "100px", textAlign: "center" }}
			>
				<Box>
					<Typography
						variant="h3"
						component="h1"
						overflow="hidden"
						sx={{
							fontSize: "13em",
							opacity: ".3",
						}}
					>
						404
					</Typography>
					<Typography variant="h3">Такой страницы не существует</Typography>
					<Typography variant="h5">
						Но есть оборудование доступное для аренды!
					</Typography>
					<Container
						style={{ marginTop: "20px" }}
						sx={{ "&& > *": { margin: "10px", width: "160px" } }}
					>
						<Button
							variant="contained"
							startIcon={<HomeIcon />}
							onClick={() => navigate("/")}
						>
							На главную
						</Button>
						{isPreviousPageFromSameDomain() && (
							<Button
								variant="contained"
								startIcon={<ArrowBackIcon />}
								onClick={() => navigate(-1)}
							>
								Вернуться
							</Button>
						)}
					</Container>
				</Box>
			</Container>
		</>
	);
};

export default NotFoundPage;
