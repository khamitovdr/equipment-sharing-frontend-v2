import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, CircularProgress } from "@mui/material";
import { ReactNode } from "react";
import {
	DefaultValues,
	FieldValues,
	FormProvider,
	SubmitHandler,
	useForm,
} from "react-hook-form";
import { ZodSchema } from "zod";
import FormErrorMessage from "../../components/ui/FormErrorMessage";
import { useSignupStore } from "../../stores/createUserStore";

type StepLayoutProps<T extends FieldValues> = {
	schema: ZodSchema<T>;
	// onSubmit: SubmitHandler<T>;
	children: ReactNode;
};

const StepLayout = <T extends FieldValues>({
	schema,
	// onSubmit,
	children,
}: StepLayoutProps<T>) => {
	const userData = useSignupStore((state) => state.userData);
	const updateUserData = useSignupStore((state) => state.updateUserData);
	const nextStep = useSignupStore((state) => state.nextStep);
	const prevStep = useSignupStore((state) => state.prevStep);

	const methods = useForm<T>({
		resolver: zodResolver(schema),
		defaultValues: userData as unknown as DefaultValues<T>,
	});
	const {
		handleSubmit,
		formState: { errors, isSubmitting },
	} = methods;

	const onSubmit: SubmitHandler<T> = async (data) => {
		updateUserData(data);
		nextStep();
	};

	return (
		<FormProvider {...methods}>
			<form noValidate onSubmit={handleSubmit(onSubmit)}>
				<Box display="flex" flexDirection="column" alignItems="stretch">
					{children}

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
		</FormProvider>
	);
};

export default StepLayout;
