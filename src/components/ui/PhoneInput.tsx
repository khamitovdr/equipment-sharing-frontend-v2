import React from "react";
import { MuiTelInput } from "mui-tel-input";
import {
	FieldErrors,
	FieldValues,
	Path,
	UseFormRegister,
} from "react-hook-form";

type PhoneInputProps<T extends FieldValues> = {
	fieldName: Path<T>;
	label: string;
	required?: boolean;
	register: UseFormRegister<T>;
	errors: FieldErrors<T>;
} & React.ComponentProps<typeof MuiTelInput>;

const PhoneInput = <T extends FieldValues>(props: PhoneInputProps<T>) => {
	const { fieldName, label, required, register, errors, ...rest } = props;
	// const [phone, setPhone] = React.useState("");

	// const handleChange = (newPhone: React.SetStateAction<string>) => {
	// 	setPhone(newPhone);
	// 	console.log(newPhone);
	// };

	const { ref, ...inputProps } = register(fieldName);

	return (
		<MuiTelInput
			// {...register(fieldName)}
			{...inputProps}
			ref={ref}

			required={required}
			autoFocus
			margin="normal"
			label={label}
			fullWidth
			error={!!errors[fieldName]}
			helperText={errors[fieldName]?.message as React.ReactNode}
            
			// value={phone}
			onChange={(value, info) => {
				inputProps.onChange({
					target: {
						value,
						name: fieldName,
					},
					type: "change",
				});
			}}

			forceCallingCode
			disableDropdown
			defaultCountry="RU"
			inputProps={{ maxLength: 13 }}
			getFlagElement={() => null}
			{...rest}
		/>
	);
};

export default PhoneInput;
