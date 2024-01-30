import { Box } from "@mui/material";
import { Navigate, useParams } from "react-router-dom";
import OrganizationByInnAutocomplete from "../components/ui/InnAutocompleteInput";
import PasswordInput from "../components/ui/PasswordInput";
import PhoneNumberInput from "../components/ui/PhoneInput";
import TextInput from "../components/ui/TextInput";
import {
	NameEmailSchema,
	PasswordConfirmationSchema,
	PhoneSchema,
} from "../models/SignUp";
import { UserOrganizationSchema } from "../models/organizationsAutocomplete";
import StepLayout from "./SignUpStepLayout";

const NameEmailStep = () => {
	return (
		<StepLayout schema={NameEmailSchema} nextStep="password">
			<TextInput fieldName="surname" label="Фамилия" required />
			<Box
				display="flex"
				flexDirection={{ xs: "column", sm: "row" }}
				alignItems="stretch"
				gap={{ xs: 0, sm: 3 }}
			>
				<TextInput fieldName="name" label="Имя" required />
				<TextInput fieldName="middle_name" label="Отчество" />
			</Box>
			<TextInput fieldName="email" label="Email" required />
		</StepLayout>
	);
};

const PasswordStep = () => {
	return (
		<StepLayout
			schema={PasswordConfirmationSchema}
			prevStep="name-email"
			nextStep="phone"
		>
			<PasswordInput fieldName="password" label="Пароль" required />
			<PasswordInput
				fieldName="passwordConfirmation"
				label="Подтвердите пароль"
				required
			/>
		</StepLayout>
	);
};

const PhoneStep = () => {
	return (
		<StepLayout
			schema={PhoneSchema}
			prevStep="password"
			nextStep="organization"
		>
			<PhoneNumberInput fieldName="phone" label="Номер телефона" required />
		</StepLayout>
	);
};

const OrganizationStep = () => {
	return (
		<StepLayout
			schema={UserOrganizationSchema}
			prevStep="phone"
			nextStep="success"
		>
			<OrganizationByInnAutocomplete label="Организация" required />
		</StepLayout>
	);
};

const SignUpSteps = () => {
	const { step } = useParams();

	switch (step) {
		case "name-email":
			return <NameEmailStep />;
		case "password":
			return <PasswordStep />;
		case "phone":
			return <PhoneStep />;
		case "organization":
			return <OrganizationStep />;
		case "success":
			return <PhoneStep />;
		default:
			return <Navigate to="/*" />;
	}
};

export default SignUpSteps;
