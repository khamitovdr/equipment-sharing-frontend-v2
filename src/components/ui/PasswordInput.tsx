import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
	FormControl,
	FormHelperText,
	IconButton,
	InputAdornment,
	InputLabel,
	OutlinedInput,
} from "@mui/material";
import React, { useState } from "react";
import {
	FieldErrors,
	FieldValues,
	Path,
	UseFormRegister,
} from "react-hook-form";

type PasswordInputProps<T extends FieldValues> = {
	fieldName: Path<T>;
	label: string;
	required?: boolean;
	register: UseFormRegister<T>;
	errors: FieldErrors<T>;
} & React.ComponentProps<typeof FormControl>;

const PasswordInput = <T extends FieldValues>(props: PasswordInputProps<T>) => {
	const { fieldName, label, required, register, errors, ...rest } = props;

	const [showPassword, setShowPassword] = useState(false);
	const handleClickShowPassword = () => setShowPassword((show) => !show);
	const handleMouseDownPassword = (
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		event.preventDefault();
	};

	return (
		<FormControl
			required={required}
			margin="normal"
			variant="outlined"
			{...rest}
		>
			<InputLabel
				htmlFor={`outlined-adornment-password-${fieldName}`}
				error={!!errors[fieldName]}
			>
				{label}
			</InputLabel>
			<OutlinedInput
				{...register(fieldName)}
				error={!!errors[fieldName]}
				id={`outlined-adornment-password-${fieldName}`}
				type={showPassword ? "text" : "password"}
				endAdornment={
					<InputAdornment position="end">
						<IconButton
							aria-label="toggle password visibility"
							onClick={handleClickShowPassword}
							onMouseDown={handleMouseDownPassword}
							edge="end"
						>
							{showPassword ? <VisibilityOff /> : <Visibility />}
						</IconButton>
					</InputAdornment>
				}
				label={label}
			/>
			<FormHelperText error={!!errors[fieldName]}>
				{errors[fieldName]?.message as React.ReactNode}
			</FormHelperText>
		</FormControl>
	);
};

export default PasswordInput;
