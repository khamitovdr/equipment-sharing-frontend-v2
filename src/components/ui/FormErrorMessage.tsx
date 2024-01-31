import { Alert, AlertProps } from "@mui/material";

type AlertInputProps = {
	isError?: boolean;
	errorMessage?: string;
} & AlertProps;

const FormErrorMessage = (props: AlertInputProps) => {
	const { isError, errorMessage, ...rest } = props;

	if (!isError) {
		return;
	}

	return (
		<Alert severity="error" sx={{ mt: 2 }} {...rest}>
			{errorMessage}
		</Alert>
	);
};

export default FormErrorMessage;
