import { Box, Typography } from "@mui/material";
import EmptyBoxIcon from "/empty-box.svg";

const EmptyPlaceholder = () => {
	return (
		<Box
			display="flex"
            flexDirection="column"
			justifyContent="center"
			alignItems="center"
			height="100%"
			width="100%"
            py={20}
		>
			<img src={EmptyBoxIcon} alt="empty" width="70" />
			<Typography variant="h6" color="textSecondary">
				Тут пока пусто...
			</Typography>
		</Box>
	);
};

export default EmptyPlaceholder;
