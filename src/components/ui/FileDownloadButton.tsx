import GetAppIcon from "@mui/icons-material/GetApp";
import { Button, ButtonProps } from "@mui/material";
import { brightBlue } from "src/styles";

type DownloadButtonProps = {
	url: string;
	text: string;
} & ButtonProps;

const DownloadButton: React.FC<DownloadButtonProps> = ({
	url,
	text,
	...rest
}) => {
	return (
		<Button
			variant="outlined"
			sx={{
				backgroundColor: brightBlue,
			}}
			startIcon={<GetAppIcon />}
			onClick={() => window.open(url, "_blank")}
			{...rest}
		>
			{text}
		</Button>
	);
};

export default DownloadButton;
