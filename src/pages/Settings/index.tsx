import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import MainPageHeader from "src/pages/MainPage/MainPageHeader";
import { getCurrentUser, updateCurrentUser } from "src/api/organizations";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import TextInput from "src/components/ui/TextInput";
import PhoneNumberInput from "src/components/ui/PhoneInput";
import PasswordInput from "src/components/ui/PasswordInput";
import { NameEmailSchema, PasswordSchema, PhoneSchema } from "src/models/SignUp";

// Build settings schema using SignUp validators and password rules
const SettingsSchema = NameEmailSchema.extend(PhoneSchema.shape)
    .extend({
        password: z.string().optional(),
        new_password: z.string().optional(),
        organization_inn: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        // If changing password, both fields are required
        const isPasswordChange = !!data.password || !!data.new_password;
        if (isPasswordChange) {
            if (!data.password) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Введите текущий пароль", path: ["password"] });
            }
            if (!data.new_password) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Введите новый пароль", path: ["new_password"] });
            }
            if (data.new_password) {
                const res = PasswordSchema.safeParse({ password: data.new_password });
                if (!res.success) {
                    res.error.issues.forEach((issue) =>
                        ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue.message, path: ["new_password"] })
                    );
                }
            }
        }
    });

type SettingsFields = z.infer<typeof SettingsSchema>;

const SettingsPage = () => {
    const { data: user, isPending } = useQuery({
        queryKey: ["me"],
        queryFn: getCurrentUser,
    });

    const methods = useForm<SettingsFields>({
        resolver: zodResolver(SettingsSchema),
        defaultValues: {
            email: "",
            phone: "",
            name: "",
            middle_name: "",
            surname: "",
            organization_inn: "",
            password: "",
            new_password: "",
        },
    });
    const { handleSubmit, reset, formState } = methods;

    useEffect(() => {
        if (user) {
            reset({
                email: user.email,
                phone: user.phone,
                name: user.name,
                middle_name: user.middle_name ?? "",
                surname: user.surname,
                organization_inn: "",
                password: "",
                new_password: "",
            });
        }
    }, [user, reset]);

    const mutation = useMutation({
        mutationFn: (data: SettingsFields) => {
            const { password, new_password, ...rest } = data;
            const payload = {
                ...rest,
                ...(password ? { password } : {}),
                ...(new_password ? { new_password } : {}),
            };
            return updateCurrentUser(payload);
        },
    });

    const onSubmit: SubmitHandler<SettingsFields> = async (data) => {
        await mutation.mutateAsync(data);
    };

    return (
        <>
            <MainPageHeader />
            <Container sx={{ py: { xs: 2, md: 4 } }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>Личные данные</Typography>
                    {isPending ? (
                        <Typography>Загрузка...</Typography>
                    ) : (
                        <FormProvider {...methods}>
                            <form noValidate onSubmit={handleSubmit(onSubmit)}>
                                <Box display="flex" flexDirection="column" gap={2}>
                                    <TextInput fieldName="email" label="Email" required fullWidth />
                                    <PhoneNumberInput fieldName="phone" label="Телефон" fullWidth />
                                    <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2}>
                                        <TextInput fieldName="name" label="Имя" required fullWidth />
                                        <TextInput fieldName="middle_name" label="Отчество" fullWidth />
                                        <TextInput fieldName="surname" label="Фамилия" required fullWidth />
                                    </Box>

                                    <Typography variant="h6" sx={{ mt: 2 }}>Смена пароля</Typography>
                                    <PasswordInput fieldName="password" label="Текущий пароль" />
                                    <PasswordInput fieldName="new_password" label="Новый пароль" />

                                    <Button type="submit" variant="contained" size="large" disabled={mutation.isPending || formState.isSubmitting}>
                                        {mutation.isPending || formState.isSubmitting ? "Сохранение..." : "Сохранить"}
                                    </Button>
                                    {mutation.isError && (
                                        <Typography color="error">{(mutation.error as Error).message}</Typography>
                                    )}
                                    {mutation.isSuccess && (
                                        <Typography color="success.main">Сохранено</Typography>
                                    )}
                                </Box>
                            </form>
                        </FormProvider>
                    )}
                </Paper>
            </Container>
        </>
    );
};

export default SettingsPage;


