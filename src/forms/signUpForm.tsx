import { DevTool } from "@hookform/devtools";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, BoxProps, Button, CircularProgress } from "@mui/material";
import { AxiosError } from "axios";
import React from "react";
import { DaDataPartySuggestion } from "react-dadata";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import InnAutocompleteInput from "../components/ui/InnAutocompleteInput";
import PasswordInput from "../components/ui/PasswordInput";
import PhoneNumberInput from "../components/ui/PhoneInput";
import TextInput from "../components/ui/TextInput";
import { UserData } from "../models/SignUp";
import { Routes } from "../router/routes";
import isPhoneValid from "../utils/phoneValidation";
import useFormLeavingAction from "../hooks/usePageLeaving";

const schema = z
	.object({
		name: z.string().min(1, "Поле не может быть пустым"),
		middle_name: z.string(),
		surname: z.string().min(1, "Поле не может быть пустым"),
		email: z.string().email("Введите корректный email"),

		password: z
			.string()
			.min(8, "Пароль должен быть не менее 8 символов")
			.regex(/[A-ZА-Я]/, {
				message: "Пароль должен содержать хотя бы одну заглавную букву",
			})
			.regex(/[a-zа-я]/, {
				message: "Пароль должен содержать хотя бы одну строчную букву",
			})
			.regex(/[0-9]/, { message: "Пароль должен содержать хотя бы одну цифру" })
			.regex(/[^a-zа-яA-ZА-Я0-9]/, {
				message:
					"Пароль должен содержать хотя бы один спецсимвол, например: !@#$%^&*() и т.д.",
			}),
		passwordConfirmation: z.string(),

		phone: z.string().refine(isPhoneValid, {
			message: "Введите корректный номер телефона",
		}),
	})
	.refine((data) => data.password === data.passwordConfirmation, {
		message: "Пароли должны совпадать",
		path: ["passwordConfirmation"],
	});

type FormFields = z.infer<typeof schema>;

type SignUpFormProps = {
	userData: UserData;
	updateUserData: (newData: Partial<UserData>) => void;
	submitUserData: () => Promise<void>;
} & BoxProps;

const SignUpForm = (props: SignUpFormProps) => {
	const { userData, updateUserData, submitUserData, ...rest } = props;

	const navigate = useNavigate();

	const {
		control,
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting, isDirty },
	} = useForm<FormFields>({
		resolver: zodResolver(schema),
		defaultValues: userData,
	});

	useFormLeavingAction({ isDirty });

	const onSubmit: SubmitHandler<FormFields> = async (data) => {
		updateUserData({
			...data,
			is_owner: true,
			organization_inn: "9729311480",
		});

		try {
			await submitUserData();
			navigate(Routes.Home);
		} catch (err) {
			const axiosError = err as AxiosError;
			setError("root", {
				type: "manual",
				// message: axiosError.response?.data?.detail,
				message: "Ошибка при регистрации",
			});
			console.log(axiosError.response?.data);
		}
	};

	const [selectedOption, setSelectedOption] = React.useState<
		DaDataPartySuggestion | undefined
	>();

	return (
		<Box {...rest}>
			<form noValidate onSubmit={handleSubmit(onSubmit)}>
				<Box display="flex" flexDirection="column" alignContent="center">
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

					<PasswordInput
						fieldName="password"
						label="Пароль"
						required
						register={register}
						errors={errors}
					/>

					<PasswordInput
						fieldName="passwordConfirmation"
						label="Подтвердите пароль"
						required
						register={register}
						errors={errors}
					/>

					<PhoneNumberInput
						fieldName="phone"
						label="Номер телефона"
						required
						register={register}
						errors={errors}
					/>

					<InnAutocompleteInput
						label="Организация"
						required
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
							"Зарегистрироваться"
						)}
					</Button>

					<FormErrorMessage errors={errors} />
				</Box>
			</form>
			<DevTool control={control} />
		</Box>
	);
};

export default SignUpForm;
