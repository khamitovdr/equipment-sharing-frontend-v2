// import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DaDataPartySuggestion } from "react-dadata";
import {
	DefaultValues,
	FieldValues,
	FormProvider,
	SubmitHandler,
	useForm,
} from "react-hook-form";
import { ZodSchema } from "zod";
import { fetchOrganizationSuggestionByInn } from "../../api/dadata";
import { postOrganization } from "../../api/organizations";
import FormErrorMessage from "../../components/ui/FormErrorMessage";
import InnAutocompleteInput from "../../components/ui/InnAutocompleteInput";
import useFormLeavingAction from "../../hooks/usePageLeaving";
import { useSignupStore } from "../../stores/createUserStore";

type OrganizationStepProps<T extends FieldValues> = {
	schema: ZodSchema<T>;
	// onSubmit: SubmitHandler<T>;
	// children: ReactNode;
};

const OrganizationStep = <T extends FieldValues>({
	schema,
	// onSubmit,
}: OrganizationStepProps<T>) => {
	const userData = useSignupStore((state) => state.userData);
	const updateUserData = useSignupStore((state) => state.updateUserData);
	const nextStep = useSignupStore((state) => state.nextStep);
	const prevStep = useSignupStore((state) => state.prevStep);
	const organization_inn = useSignupStore(
		(state) => state.userData.organization_inn,
	);

	const methods = useForm<T>({
		// resolver: zodResolver(schema),
		defaultValues: userData as unknown as DefaultValues<T>,
	});
	const {
		handleSubmit,
		formState: { errors, isDirty, isSubmitting },
	} = methods;

	const { isSuccess, data: suggestion } = useQuery({
		queryKey: ["organization", { organization_inn }],
		queryFn: () => fetchOrganizationSuggestionByInn(organization_inn),
		enabled: !!organization_inn,
	});

	useFormLeavingAction({ isDirty });

	const [selectedOption, setSelectedOption] =
		useState<DaDataPartySuggestion | null>(null);

	useEffect(() => {
		if (suggestion) {
			setSelectedOption(suggestion);
		}
	}, [suggestion]);

	const onSubmit: SubmitHandler<T> = async () => {
		try {
			const response = await postOrganization({ suggestion: selectedOption });

			updateUserData({
				organization_inn: response.inn,
			});

			nextStep();
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<FormProvider {...methods}>
			<form noValidate onSubmit={handleSubmit(onSubmit)}>
				<Box display="flex" flexDirection="column" alignItems="stretch">
					<InnAutocompleteInput
						label="ИНН организации"
						name="organization_inn"
						isReady={(!!organization_inn && isSuccess) || !organization_inn}
						selectedOption={selectedOption}
						setSelectedOption={setSelectedOption}
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
		</FormProvider>
	);
};

export default OrganizationStep;
