import { Box, Container, Link as MuiLink, Stack, Typography } from "@mui/material";
import HeaderLogo from "src/pages/MainPage/HeaderLogo";

const Footer = () => {
	return (
		<Box component="footer" sx={{ bgcolor: "#f5f5f5", mt: 4, py: 3 }}>
			<Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
				<HeaderLogo />
				<Stack spacing={0.5} alignItems={{ xs: "center", sm: "flex-end" }}>
					<Typography variant="body2">ООО «ЦПСИА»</Typography>
					<Typography variant="body2">
						Тел.: <MuiLink href="tel:+79773776695">+7-977-377-66-95</MuiLink>
					</Typography>
					<Typography variant="body2">
						Почта: <MuiLink href="mailto:info@equip-me.ru">info@equip-me.ru</MuiLink>
					</Typography>
				</Stack>
			</Container>
		</Box>
	);
};

export default Footer;


