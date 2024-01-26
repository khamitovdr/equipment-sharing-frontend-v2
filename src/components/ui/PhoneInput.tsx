import { BaseTextFieldProps, TextField } from "@mui/material";
import { ChangeEvent } from "react";
import { FieldValues, Path, useFormContext } from "react-hook-form";
import { usePhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

type MUIPhoneProps<T extends FieldValues> = {
	fieldName: Path<T>;
	label: string;
	required?: boolean;
} & BaseTextFieldProps;

const PhoneNumberInput = <T extends FieldValues>(props: MUIPhoneProps<T>) => {
	const { fieldName, label, required, ...rest } = props;

	const {
		register,
		formState: { errors },
	} = useFormContext<T>();

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
			if (["7", "8"].includes(value)) {
				e.target.value = "+7";
			} else if (value === "+") {
				e.target.value = "";
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
