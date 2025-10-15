import { Box, Button, Container, Paper, Typography, Divider } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import MainPageHeader from "src/pages/MainPage/MainPageHeader";
import Footer from "src/components/Footer";
import { getCurrentUser, updateCurrentUser, updateUserRequisites, getMyOrganization, updateOrganizationContactsByMember } from "src/api/organizations";
import { fetchOrganizationByInn } from "src/api/dadata";
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
        // Organization contact fields
        contact_phone: z.string().optional(),
        contact_email: z.string().optional(),
        contact_employee_name: z.string().optional(),
        contact_employee_middle_name: z.string().optional(),
        contact_employee_surname: z.string().optional(),
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

    const { data: organization } = useQuery({
        queryKey: ["myOrganization"],
        queryFn: getMyOrganization,
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
            contact_phone: "",
            contact_email: "",
            contact_employee_name: "",
            contact_employee_middle_name: "",
            contact_employee_surname: "",
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
                contact_phone: organization?.contact_phone || "",
                contact_email: organization?.contact_email || "",
                contact_employee_name: organization?.contact_employee_name || "",
                contact_employee_middle_name: organization?.contact_employee_middle_name || "",
                contact_employee_surname: organization?.contact_employee_surname || "",
            });
        }
    }, [user, organization, reset]);

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

    // Requisites state and submit
    const requisitesMutation = useMutation({
        mutationFn: async () => {
            // Use bank_inn from requisites to fetch organization data
            const bankInn = user?.requisites?.bank_inn || "";
            if (!bankInn) {
                throw new Error("Нет ИНН банка для обновления реквизитов");
            }
            const dadata = await fetchOrganizationByInn(bankInn);
            return updateUserRequisites({
                payment_account: user?.requisites?.payment_account || "",
                dadata_response: (dadata || {}) as Record<string, unknown>,
            });
        },
    });

    return (
        <Box display="flex" flexDirection="column" minHeight="100vh">
            <MainPageHeader />
            <Container sx={{ py: { xs: 2, md: 4 }, flex: 1 }}>
                {isPending ? (
                    <Typography>Загрузка...</Typography>
                ) : (
                    <FormProvider {...methods}>
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h5" sx={{ mb: 2 }}>Личные данные</Typography>
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
                        </Paper>

                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h5" sx={{ mb: 2 }}>Реквизиты</Typography>
                            {user?.requisites ? (
                                <Box display="flex" flexDirection="column" gap={1}>
                                    <Typography variant="body2">Расчётный счёт: {user.requisites.payment_account || "—"}</Typography>
                                    <Typography variant="body2">БИК банка: {user.requisites.bank_bic || "—"}</Typography>
                                    <Typography variant="body2">ИНН банка: {user.requisites.bank_inn || "—"}</Typography>
                                    <Typography variant="body2">Банк: {user.requisites.bank_name || "—"}</Typography>
                                    <Typography variant="body2">Корр. счёт: {user.requisites.bank_correspondent_account || "—"}</Typography>

                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Чтобы обновить реквизиты, укажите актуальные данные в вашем банке. Мы сверим их по DaData и применим.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        disabled={requisitesMutation.isPending}
                                        onClick={() => requisitesMutation.mutate()}
                                        sx={{ mt: 1, alignSelf: "flex-start" }}
                                    >
                                        {requisitesMutation.isPending ? "Обновление..." : "Обновить реквизиты"}
                                    </Button>
                                    {requisitesMutation.isError && (
                                        <Typography color="error">{(requisitesMutation.error as Error).message}</Typography>
                                    )}
                                    {requisitesMutation.isSuccess && (
                                        <Typography color="success.main">Реквизиты обновлены</Typography>
                                    )}
                                </Box>
                            ) : (
                                <Typography>Реквизиты не указаны</Typography>
                            )}
                        </Paper>

                        <Paper sx={{ p: 3, mt: 3 }}>
                            <Typography variant="h5" sx={{ mb: 2 }}>Организация</Typography>
                            {organization ? (
                                <Box display="flex" flexDirection="column" gap={1}>
                                    <Typography variant="body2">ИНН: {organization.inn}</Typography>
                                    <Typography variant="body2">Краткое название: {organization.short_name || "—"}</Typography>
                                    <Typography variant="body2">Полное название: {organization.full_name || "—"}</Typography>
                                    <Typography variant="body2">Юр. адрес: {organization.legal_address || "—"}</Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle1">Контакты</Typography>
                                    <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2}>
                                        <TextInput fieldName="contact_phone" label="Телефон" fullWidth />
                                        <TextInput fieldName="contact_email" label="Email" fullWidth />
                                    </Box>
                                    <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2}>
                                        <TextInput fieldName="contact_employee_name" label="Имя контактного лица" fullWidth />
                                        <TextInput fieldName="contact_employee_middle_name" label="Отчество" fullWidth />
                                        <TextInput fieldName="contact_employee_surname" label="Фамилия" fullWidth />
                                    </Box>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        sx={{ mt: 1, alignSelf: "flex-start" }}
                                        onClick={async () => {
                                            const form = methods.getValues();
                                            await updateOrganizationContactsByMember({
                                                contact_phone: form.contact_phone || "",
                                                contact_email: form.contact_email || "",
                                                contact_employee_name: form.contact_employee_name || "",
                                                contact_employee_middle_name: form.contact_employee_middle_name || "",
                                                contact_employee_surname: form.contact_employee_surname || "",
                                            });
                                        }}
                                    >
                                        Сохранить контакты
                                    </Button>
                                </Box>
                            ) : (
                                <Typography>Организация не найдена</Typography>
                            )}
                        </Paper>
                    </FormProvider>
                )}
            </Container>
            <Footer />
        </Box>
    );
};

export default SettingsPage;


