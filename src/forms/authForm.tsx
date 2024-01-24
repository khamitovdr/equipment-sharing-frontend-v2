import { DevTool } from "@hookform/devtools";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, CircularProgress, Divider } from "@mui/material";
import { AxiosError } from "axios";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import FormErrorMessage from "../components/ui/FormErrorMessage";
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

	const {
		control,
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<FormFields>({
		resolver: zodResolver(schema),
	});

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
		<>
			<form noValidate onSubmit={handleSubmit(onSubmit)}>
				<Box p={4} display="flex" flexDirection="column" alignContent="center">
					<TextInput
						fieldName="username"
						label="Email"
						required
						register={register}
						errors={errors}
					/>

					<PasswordInput
						fieldName="password"
						label="Пароль"
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
							"Войти"
						)}
					</Button>

					<FormErrorMessage errors={errors} />

					<Divider variant="middle" sx={{ mt: 2 }}>
						Ещё нет аккаунта?
					</Divider>
					<Button variant="outlined" sx={{ mt: 2 }} size="large" fullWidth>
						Зарегистрироваться
					</Button>
				</Box>
			</form>
			<DevTool control={control} />
		</>
	);
};

export default LoginForm;
