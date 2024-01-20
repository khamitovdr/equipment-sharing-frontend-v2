import { Alert } from "@mui/material";
import { FieldErrors, FieldValues } from "react-hook-form";

type AlertInputProps<T extends FieldValues> = {
	errors: FieldErrors<T>;
} & React.ComponentProps<typeof Alert>;

const FormErrorMessage = <T extends FieldValues>(props: AlertInputProps<T>) => {
	const { errors, ...rest } = props;

	if (errors.root) {
		return (
			<Alert severity="error" sx={{ mt: 2 }} {...rest}>
				{errors.root.message}
			</Alert>
		);
	}
};

export default FormErrorMessage;
