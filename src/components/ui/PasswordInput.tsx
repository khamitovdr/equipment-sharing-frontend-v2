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
import { FieldValues, Path, useFormContext } from "react-hook-form";

type PasswordInputProps<T extends FieldValues> = {
	fieldName: Path<T>;
	label: string;
	required?: boolean;
} & React.ComponentProps<typeof FormControl>;

const PasswordInput = <T extends FieldValues>(props: PasswordInputProps<T>) => {
	const { fieldName, label, required, ...rest } = props;

	const {
		register,
		formState: { errors },
	} = useFormContext<T>();

	const [showPassword, setShowPassword] = useState(false);
	const handleClickShowPassword = () => setShowPassword((show) => !show);
	const handleMouseDownPassword = (
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		event.preventDefault();
	};

	const isErrors = !!errors[fieldName];

	return (
		<FormControl
			required={required}
			margin="normal"
			variant="outlined"
			{...rest}
		>
			<InputLabel
				htmlFor={`outlined-adornment-password-${fieldName}`}
				error={isErrors}
			>
				{label}
			</InputLabel>
			<OutlinedInput
				{...register(fieldName)}
				error={isErrors}
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
			{isErrors && (
				<FormHelperText error={isErrors}>
					{errors[fieldName]?.message as React.ReactNode}
				</FormHelperText>
			)}
		</FormControl>
	);
};

export default PasswordInput;
