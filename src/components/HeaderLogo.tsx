import { Typography } from "@mui/material";
import AgricultureOutlinedIcon from "@mui/icons-material/AgricultureOutlined";

const HeaderLogo = () => {
	return (
		<>
			<AgricultureOutlinedIcon sx={{ mr: 1 }} />
			<Typography
				variant="h6"
				noWrap
				component="a"
				href="/"
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
		</>
	);
};

export default HeaderLogo;
