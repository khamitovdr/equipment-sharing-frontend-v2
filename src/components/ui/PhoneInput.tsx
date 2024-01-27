import { BaseTextFieldProps, TextField } from "@mui/material";
import { ChangeEvent } from "react";
import { Controller, FieldValues, Path } from "react-hook-form";
import { usePhoneInput } from "react-international-phone";

type MUIPhoneProps<T extends FieldValues> = {
	fieldName: Path<T>;
	label: string;
} & BaseTextFieldProps;

const PhoneNumberInput = <T extends FieldValues>(props: MUIPhoneProps<T>) => {
	const { fieldName, label, ...rest } = props;

	const { inputValue, handlePhoneValueChange, inputRef } = usePhoneInput({
		disableDialCodePrefill: true,
		disableCountryGuess: true,
		defaultCountry: "ru",
	});

	const prefillPhone = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const value = e.target.value;
		if (value.length > 18) {
			e.target.value = value.slice(0, 18);
		} else if (value.length < 2) {
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
		<Controller
			name={fieldName}
			render={({
				field: { ref, value, onChange, ...restField },
				fieldState: { invalid, error },
			}) => (
				<TextField
					{...restField}
					label={label}
					error={invalid}
					helperText={error?.message as React.ReactNode}
					variant="outlined"
					margin="normal"
					type="tel"
					fullWidth
					placeholder="+7 (900) 000-00-00"
					value={inputValue || value}
					onChange={(e) => {
						prefillPhone(e);
						handlePhoneValueChange(e);
						onChange(e);
					}}
					inputRef={(el) => {
						inputRef.current = el;
						ref(el);
					}}
					{...rest}
				/>
			)}
		/>
	);
};

export default PhoneNumberInput;
