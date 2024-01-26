import { Box, Button, CircularProgress } from "@mui/material";
import TextInput from "../../components/ui/TextInput";
import { NameEmailSchema, NameEmail } from "../../models/SignUp";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignupStore } from "../../stores/createUserStore";
import FormErrorMessage from "../../components/ui/FormErrorMessage";

const NameEmailStep = () => {
	const userData = useSignupStore((state) => state.userData);
	const updateUserData = useSignupStore((state) => state.updateUserData);
	const nextStep = useSignupStore((state) => state.nextStep);
	const prevStep = useSignupStore((state) => state.prevStep);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<NameEmail>({
		resolver: zodResolver(NameEmailSchema),
		defaultValues: userData,
	});

	const onSubmit: SubmitHandler<NameEmail> = async (data) => {
		updateUserData(data);
		nextStep();
	};

	return (
		<form noValidate onSubmit={handleSubmit(onSubmit)}>
			<Box display="flex" flexDirection="column" alignItems="stretch">
				<TextInput
					fieldName="name"
					label="Имя"
					required
					register={register}
					errors={errors}
				/>

				<TextInput
					fieldName="middle_name"
					label="Отчество"
					register={register}
					errors={errors}
				/>

				<TextInput
					fieldName="surname"
					label="Фамилия"
					required
					register={register}
					errors={errors}
				/>

				<TextInput
					fieldName="email"
					label="Email"
					required
					register={register}
					errors={errors}
				/>

				<Button
					type="submit"
					variant="contained"
					sx={{ mt: 2 }}
					size="large"
					fullWidth
				>
					{isSubmitting ? (
						<CircularProgress color="inherit" size={26} />
					) : (
						"Продолжить >"
					)}
				</Button>

				<Button
					variant="contained"
					sx={{ mt: 2 }}
					size="large"
					fullWidth
					onClick={prevStep}
				>
					{"<"}
				</Button>

				<FormErrorMessage errors={errors} />
			</Box>
		</form>
	);
};

export default NameEmailStep;
