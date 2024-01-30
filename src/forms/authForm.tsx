import { DevTool } from "@hookform/devtools";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, CircularProgress } from "@mui/material";
import { AxiosError } from "axios";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import FormHeader from "../components/ui/FormHeader";
import PasswordInput from "../components/ui/PasswordInput";
import TextInput from "../components/ui/TextInput";
import { useAuthStore } from "../stores/authStore";

const schema = z.object({
	username: z.string().email("Введите корректный email"),
	password: z.string().min(1, "Поле не может быть пустым"),
});

type FormFields = z.infer<typeof schema>;

const LoginForm = () => {
	const login = useAuthStore((state) => state.login);

	const methods = useForm<FormFields>({
		resolver: zodResolver(schema),
	});
	const {
		control,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = methods;

	const onSubmit: SubmitHandler<FormFields> = async (data) => {
		try {
			await login(data);
		} catch (error) {
			switch ((error as AxiosError).response?.status) {
				case 401:
					setError("root", { message: "Неверный логин или пароль" });
					break;
				default:
					throw error;
			}
		}
	};

	return (
		<FormProvider {...methods}>
			<form noValidate onSubmit={handleSubmit(onSubmit)}>
				<Box
					p={4}
					paddingBottom={0}
					display="flex"
					flexDirection="column"
					alignContent="center"
				>
					<FormHeader text="Вход" sx={{ mb: 1 }} />

					<TextInput fieldName="username" label="Email" required />

					<PasswordInput fieldName="password" label="Пароль" required />

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
							"Войти"
						)}
					</Button>

					<FormErrorMessage errors={errors} />
				</Box>
			</form>
			<DevTool control={control} />
		</FormProvider>
	);
};

export default LoginForm;
