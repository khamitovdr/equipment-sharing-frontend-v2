import { Box, Typography } from "@mui/material";
import AgricultureOutlinedIcon from "@mui/icons-material/AgricultureOutlined";
import { Link } from "react-router-dom";
import { Routes } from "../../router/routes";

const HeaderLogo = () => {
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				textDecoration: "none",
				color: "inherit",
			}}
			component={Link}
			to={Routes.Home}
		>
			<AgricultureOutlinedIcon sx={{ mr: 1 }} />
			<Typography
				variant="h6"
				noWrap
				sx={{
					mr: 2,
					display: { xs: "none", sm: "flex" },
					fontFamily: "monospace",
					fontWeight: 700,
					letterSpacing: ".1rem",
					color: "inherit",
					textDecoration: "none",
				}}
			>
				Equip-me
			</Typography>
		</Box>
	);
};

export default HeaderLogo;
