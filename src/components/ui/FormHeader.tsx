import { Typography, TypographyProps } from "@mui/material";

type FormHeaderProps = {
	text: string;
} & TypographyProps;

const FormHeader = (props: FormHeaderProps) => {
	const { text, ...rest } = props;

	return (
		<Typography variant="h4" align="center" sx={{ mb: 3 }} {...rest}>
			{text}
		</Typography>
	);
};

export default FormHeader;
