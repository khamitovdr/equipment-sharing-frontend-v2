import { BaseTextFieldProps, TextField } from "@mui/material";
import { ChangeEvent } from "react";
import {
	FieldErrors,
	FieldValues,
	Path,
	UseFormRegister,
} from "react-hook-form";
import { usePhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

type MUIPhoneProps<T extends FieldValues> = {
	fieldName: Path<T>;
	label: string;
	required?: boolean;
	register: UseFormRegister<T>;
	errors: FieldErrors<T>;
} & BaseTextFieldProps;

const PhoneNumberInput = <T extends FieldValues>(props: MUIPhoneProps<T>) => {
	const { fieldName, label, required, register, errors, ...rest } = props;
	const { onChange, ...restRegister } = register(fieldName);

	const {
		// phone,
		inputValue,
		handlePhoneValueChange,
		inputRef,
	} = usePhoneInput({
		disableDialCodePrefill: true,
		disableCountryGuess: true,
		defaultCountry: "ru",
	});

	const prefillPhone = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const value = e.target.value;
		if (value.length < 2) {
			if (["+", "7", "8"].includes(value)) {
				e.target.value = "+7";
			} else {
				e.target.value = `+7${value}`;
			}
		}
	};

	return (
		<TextField
			{...restRegister}
			required={required}
			label={label}
			error={!!errors[fieldName]}
			helperText={errors[fieldName]?.message as React.ReactNode}
			variant="outlined"
			margin="normal"
			fullWidth
			placeholder="+7 (900) 000-00-00"
			value={inputValue}
			onChange={(e) => {
				prefillPhone(e);
				onChange(e);
				handlePhoneValueChange(e);
			}}
			type="tel"
			inputRef={inputRef}
			{...rest}
		/>
	);
};

export default PhoneNumberInput;
