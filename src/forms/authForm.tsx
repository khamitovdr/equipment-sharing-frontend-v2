import { zodResolver } from "@hookform/resolvers/zod";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	FormControl,
	FormHelperText,
	IconButton,
	InputAdornment,
	InputLabel,
	OutlinedInput,
	TextField,
} from "@mui/material";
import { AxiosError } from "axios";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { useAuthStore } from "../stores/authStore";

const schema = z.object({
	username: z.string().email("Введите корректный email"),
	password: z.string().min(1, "Поле не может быть пустым"),
});

type FormFields = z.infer<typeof schema>;

const LoginForm = () => {
	const login = useAuthStore((state) => state.login);

	const {
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

	const [showPassword, setShowPassword] = useState(false);
	const handleClickShowPassword = () => setShowPassword((show) => !show);
	const handleMouseDownPassword = (
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		event.preventDefault();
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<Box p={4} display="flex" flexDirection="column" alignContent="center">
				<TextField
					{...register("username")}
					autoFocus
					margin="normal"
					label="Email"
					fullWidth
					error={!!errors.username}
					helperText={errors.username?.message}
				/>
				<FormControl margin="normal" variant="outlined">
					<InputLabel
						htmlFor="outlined-adornment-password"
						error={!!errors.password}
					>
						Пароль
					</InputLabel>
					<OutlinedInput
						{...register("password")}
						error={!!errors.password}
						id="outlined-adornment-password"
						type={showPassword ? "text" : "password"}
						endAdornment={
							<InputAdornment position="end">
								<IconButton
									aria-label="toggle password visibility"
									onClick={handleClickShowPassword}
									onMouseDown={handleMouseDownPassword}
									edge="end"
								>
									{showPassword ? <VisibilityOff /> : <Visibility />}
								</IconButton>
							</InputAdornment>
						}
						label="Пароль"
					/>
					<FormHelperText error={!!errors.password}>
						{errors.password?.message}
					</FormHelperText>
				</FormControl>
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
				{errors.root && (
					<Alert severity="error" sx={{ mt: 4 }}>
						{errors.root.message}
					</Alert>
				)}
			</Box>
		</form>
	);
};

export default LoginForm;
