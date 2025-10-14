import { Box } from "@mui/material";
import { Navigate, useParams } from "react-router-dom";
import OrganizationByInnAutocomplete from "src/components/ui/InnAutocompleteInput";
import PasswordInput from "src/components/ui/PasswordInput";
import PhoneNumberInput from "src/components/ui/PhoneInput";
import TextInput from "src/components/ui/TextInput";
import {
	NameEmailSchema,
	PasswordConfirmationSchema,
	PhoneSchema,
} from "src/models/SignUp";
import { UserOrganizationSchema } from "src/models/organizationsAutocomplete";
import AcceptTermsStep from "src/pages/Signup/AcceptTerms";
import SelectRole from "src/pages/Signup/SelectRole";
import { useSignUpStore } from "src/stores/createUserStore";
import StepLayout from "./SignUpStepLayout";

const nSteps = 6;

const NameEmailStep = () => {
	return (
		<StepLayout
			schema={NameEmailSchema}
			nSteps={nSteps}
			activeStep={1}
			prevStep="select-role"
			nextStep="password"
		>
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
			nSteps={nSteps}
			activeStep={2}
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
			nSteps={nSteps}
			activeStep={3}
			prevStep="password"
			nextStep="organization"
		>
			<PhoneNumberInput fieldName="phone" label="Номер телефона" required />
		</StepLayout>
	);
};

const OrganizationStep = () => {
	const { is_owner } = useSignUpStore((state) => state.userData);
	return (
		<StepLayout
			schema={UserOrganizationSchema}
			required={is_owner}
			nSteps={nSteps}
			activeStep={4}
			prevStep="phone"
			nextStep="success"
		>
			<OrganizationByInnAutocomplete label="Организация" required={is_owner} />
		</StepLayout>
	);
};

const SignUpSteps = () => {
	const { step } = useParams();

	switch (step) {
		case "select-role":
			return <SelectRole nextStep="name-email" />;
		case "name-email":
			return <NameEmailStep />;
		case "password":
			return <PasswordStep />;
		case "phone":
			return <PhoneStep />;
		case "organization":
			return <OrganizationStep />;
		case "success":
			return (
				<AcceptTermsStep
					nSteps={nSteps}
					activeStep={5}
					prevStep="organization"
				/>
			);
		default:
			return <Navigate to="/*" />;
	}
};

export default SignUpSteps;
