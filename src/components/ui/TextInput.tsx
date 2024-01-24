import { TextField } from "@mui/material";
import React from "react";
import {
	FieldErrors,
	FieldValues,
	Path,
	UseFormRegister,
} from "react-hook-form";

type TextInputProps<T extends FieldValues> = {
	fieldName: Path<T>;
	label: string;
    required?: boolean;
	register: UseFormRegister<T>;
	errors: FieldErrors<T>;
} & React.ComponentProps<typeof TextField>;

const TextInput = <T extends FieldValues>(props: TextInputProps<T>) => {
	const { fieldName, label, required, register, errors, ...rest } = props;
	return (
		<TextField
			{...register(fieldName)}
            required={required}
			margin="normal"
			label={label}
			fullWidth
			error={!!errors[fieldName]}
			helperText={errors[fieldName]?.message as React.ReactNode}
			{...rest}
		/>
	);
};

export default TextInput;
