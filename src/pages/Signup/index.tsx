import HomeIcon from "@mui/icons-material/Home";
import { Button, Container, Divider } from "@mui/material";
import { Link } from "react-router-dom";
import OrganizationByInnAutocomplete from "../../components/ui/InnAutocompleteInput2";
import PasswordInput from "../../components/ui/PasswordInput";
import PhoneNumberInput from "../../components/ui/PhoneInput";
import TextInput from "../../components/ui/TextInput";
import {
	NameEmailSchema,
	// OrganizationSchema,
	PasswordConfirmationSchema,
	PhoneSchema,
} from "../../models/SignUp";
import { UserOrganizationSchema } from "../../models/organizationsAutocomplete";
import { Routes } from "../../router/routes";
import { useSignupStore } from "../../stores/createUserStore";
import StepLayout from "./StepLayout";
// import OrganizationStep from "./OrganizationStep";

const SignUpStep = ({ step }: { step: number }) => {
	switch (step) {
		case 0:
			return (
				<StepLayout schema={NameEmailSchema}>
					<TextInput fieldName="name" label="Имя" required />
					<TextInput fieldName="middle_name" label="Отчество" />
					<TextInput fieldName="surname" label="Фамилия" required />
					<TextInput fieldName="email" label="Email" required />
				</StepLayout>
			);
		case 1:
			return (
				<StepLayout schema={PasswordConfirmationSchema}>
					<PasswordInput fieldName="password" label="Пароль" required />
					<PasswordInput
						fieldName="passwordConfirmation"
						label="Подтвердите пароль"
						required
					/>
				</StepLayout>
			);
		case 2:
			return (
				<StepLayout schema={PhoneSchema}>
					<PhoneNumberInput fieldName="phone" label="Номер телефона" required />
				</StepLayout>
			);
		case 3:
			return (
				<StepLayout schema={UserOrganizationSchema}>
					<OrganizationByInnAutocomplete
						fieldName="organization_inn"
						label="Организация"
						required
					/>
				</StepLayout>
			);
		case 4:
			return (
				<StepLayout schema={PhoneSchema}>
					<div />
				</StepLayout>
			);
		default:
			return null;
	}
};

const SignUp = () => {
	const currentStep = useSignupStore((state) => state.currentStep);

	return (
		<Container
			maxWidth="sm"
			sx={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "stretch",
			}}
		>
			<SignUpStep step={currentStep} />

			<Divider variant="middle" sx={{ mt: 3, mb: 4 }} />

			<Button
				component={Link}
				to={Routes.Home}
				variant="outlined"
				sx={{ mb: 2 }}
				size="large"
				fullWidth
				startIcon={<HomeIcon />}
			>
				На главную
			</Button>
		</Container>
	);
};

export default SignUp;
