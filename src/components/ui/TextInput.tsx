import { TextField } from "@mui/material";
import React from "react";
import { FieldValues, Path, useFormContext } from "react-hook-form";

type TextInputProps<T extends FieldValues> = {
	fieldName: Path<T>;
	label: string;
	required?: boolean;
} & React.ComponentProps<typeof TextField>;

const TextInput = <T extends FieldValues>(props: TextInputProps<T>) => {
	const { fieldName, label, required, ...rest } = props;

	const {
		register,
		formState: { errors },
	} = useFormContext<T>();

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
