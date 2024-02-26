import { DevTool } from "@hookform/devtools";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, Button, CircularProgress, MobileStepper } from "@mui/material";
import { ReactNode } from "react";
import {
	DefaultValues,
	FieldValues,
	FormProvider,
	SubmitHandler,
	useForm,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import FormErrorMessage from "src/components/ui/FormErrorMessage";
import useFormLeavingAction from "src/hooks/usePageLeaving";
import { Routes } from "src/router/routes";
import { useSignUpStore } from "src/stores/createUserStore";
import { z } from "zod";

type StepLayoutProps<T extends z.ZodTypeAny> = {
	schema: T;
	required?: boolean;
	nSteps: number;
	activeStep: number;
	prevStep?: string;
	nextStep?: string;
	children: ReactNode;
};

const StepLayout = <T extends z.ZodTypeAny>({
	schema,
	required = true,
	nSteps,
	activeStep,
	prevStep,
	nextStep,
	children,
}: StepLayoutProps<T>) => {
	const navigate = useNavigate();

	const userData = useSignUpStore((state) => state.userData);
	const updateUserData = useSignUpStore((state) => state.updateUserData);

	type FormFields = z.infer<typeof schema>;

	const methods = useForm<FormFields>({
		resolver: zodResolver(required ? schema : z.any()),
		defaultValues: userData as unknown as DefaultValues<T>,
	});
	const {
		handleSubmit,
		formState: { errors, isDirty, isSubmitting },
	} = methods;

	useFormLeavingAction({ isDirty });

	const onSubmit: SubmitHandler<T> = async (data) => {
		updateUserData(data as unknown as FieldValues);
		navigate(`${Routes.SignUp}/${nextStep}`);
	};

	return (
		<>
			<MobileStepper
				steps={nSteps}
				activeStep={activeStep}
				variant="progress"
				position="static"
				backButton={null}
				nextButton={null}
				sx={{
					px: 0,
					mb: 2,
				}}
				LinearProgressProps={{
					sx: {
						flexGrow: 1,
					},
				}}
			/>
			<FormProvider {...methods}>
				<form noValidate onSubmit={handleSubmit(onSubmit)}>
					<Box display="flex" flexDirection="column" alignItems="stretch">
						{children}

						<Box
							display="flex"
							flexDirection="row"
							alignItems="stretch"
							mt={2}
							gap={2}
							height={50}
						>
							{prevStep && (
								<Button
									variant="outlined"
									size="large"
									onClick={() => navigate(`${Routes.SignUp}/${prevStep}`)}
								>
									<ChevronLeft />
								</Button>
							)}

							<Button type="submit" variant="contained" size="large" fullWidth>
								{isSubmitting ? (
									<CircularProgress color="inherit" size={26} />
								) : (
									<>
										Продолжить
										<ChevronRight sx={{ ml: 1 }} />
									</>
								)}
							</Button>
						</Box>

						<FormErrorMessage
							isError={!!errors.root}
							errorMessage={errors.root?.message}
						/>
					</Box>
				</form>
				<DevTool control={methods.control} />
			</FormProvider>
		</>
	);
};

export default StepLayout;
