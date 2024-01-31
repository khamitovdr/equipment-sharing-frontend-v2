import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import {
	Box,
	Button,
	Checkbox,
	CircularProgress,
	FormControlLabel,
	FormGroup,
	MobileStepper,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import DownloadButton from "src/components/ui/FileDownloadButton";
import FormErrorMessage from "src/components/ui/FormErrorMessage";
import { Routes } from "src/router/routes";
import { useSignupStore } from "src/stores/createUserStore";

type AcceptTermsStepProps = {
	nSteps: number;
	activeStep: number;
	prevStep?: string;
};

const AcceptTermsStep = ({
	nSteps,
	activeStep,
	prevStep,
}: AcceptTermsStepProps) => {
	const navigate = useNavigate();

	const submitUserData = useSignupStore((state) => state.submitUserData);

	const mutation = useMutation({
		mutationFn: submitUserData,
	});

	const [userAgreementAccepted, setUserAgreementAccepted] = useState(false);
	const [personalDataAgreementAccepted, setPersonalDataAgreementAccepted] =
		useState(false);

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

			<Box
				display="flex"
				flexDirection={{
					xs: "column",
					sm: "row",
				}}
				gap={2}
				mb={2}
			>
				<DownloadButton
					fullWidth
					url={import.meta.env.VITE_USER_AGREEMENT}
					text="Пользовательское соглашение"
				/>
				<DownloadButton
					fullWidth
					url={import.meta.env.VITE_PERSONAL_DATA_PROCESSING}
					text="Согласие на обработку персональных данных"
				/>
			</Box>

			<FormGroup
				sx={{
					ml: 1,
					"& .MuiFormControlLabel-root": {
						mb: 1,
					},
				}}
			>
				<FormControlLabel
					required
					control={
						<Checkbox
							checked={userAgreementAccepted}
							onChange={(e) => setUserAgreementAccepted(e.target.checked)}
						/>
					}
					label="Принимаю условия пользовательского соглашения"
				/>

				<FormControlLabel
					required
					control={
						<Checkbox
							checked={personalDataAgreementAccepted}
							onChange={(e) =>
								setPersonalDataAgreementAccepted(e.target.checked)
							}
						/>
					}
					label="Даю согласие на обработку персональных данных"
				/>
			</FormGroup>

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
						onClick={() => navigate(`${Routes.Signup}/${prevStep}`)}
					>
						<ChevronLeft />
					</Button>
				)}

				<Button
					variant="contained"
					size="large"
					fullWidth
					disabled={!userAgreementAccepted || !personalDataAgreementAccepted}
					onClick={async () => mutation.mutate()}
				>
					{mutation.isPending ? (
						<CircularProgress color="inherit" size={26} />
					) : (
						<>
							Зарегистрироваться
							<ChevronRight sx={{ ml: 1 }} />
						</>
					)}
				</Button>
			</Box>

			<FormErrorMessage
				isError={mutation.isError}
				errorMessage={mutation.error?.message}
			/>

			{mutation.isSuccess && <Navigate to={Routes.Home} />}
		</>
	);
};

export default AcceptTermsStep;
