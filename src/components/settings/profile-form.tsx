"use client";

import { useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUpdateProfile } from "@/lib/hooks/use-update-profile";
import { ApiRequestError } from "@/lib/api/client";
import {
  profileSchema,
  type ProfileFormData,
} from "@/lib/validators/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/shared/phone-input";
import { formatPhone } from "@/lib/utils/phone";

export function ProfileForm() {
  const t = useTranslations();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileFormData>,
    defaultValues: {
      name: user?.name ?? "",
      surname: user?.surname ?? "",
      middle_name: user?.middle_name ?? "",
      email: user?.email ?? "",
      phone: formatPhone(user?.phone ?? ""),
    },
  });

  // Sync form when user data changes (e.g., after avatar upload updates the store)
  useEffect(() => {
    if (user) {
      reset(
        {
          name: user.name,
          surname: user.surname,
          middle_name: user.middle_name ?? "",
          email: user.email,
          phone: formatPhone(user.phone),
        },
        { keepDirty: true }
      );
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const updatedUser = await updateProfile.mutateAsync({
        name: data.name,
        surname: data.surname,
        middle_name: data.middle_name || null,
        email: data.email,
        phone: data.phone,
      });
      reset({
        name: updatedUser.name,
        surname: updatedUser.surname,
        middle_name: updatedUser.middle_name ?? "",
        email: updatedUser.email,
        phone: formatPhone(updatedUser.phone),
      });
      toast.success(t("settings.success.profile"));
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError("email", { message: "emailTaken" });
      } else {
        toast.error(t("common.error"));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.profile")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <fieldset className="space-y-4">
            <legend className="sr-only">{t("settings.profile")}</legend>

            {/* Name + Surname */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="settings-name">{t("settings.name")}</Label>
                <Input
                  id="settings-name"
                  type="text"
                  autoComplete="given-name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "settings-name-error" : undefined}
                  {...register("name")}
                />
                {errors.name && (
                  <p id="settings-name-error" className="text-xs text-destructive">
                    {t(`settings.validation.${errors.name.message}`)}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-surname">{t("settings.surname")}</Label>
                <Input
                  id="settings-surname"
                  type="text"
                  autoComplete="family-name"
                  aria-invalid={!!errors.surname}
                  aria-describedby={errors.surname ? "settings-surname-error" : undefined}
                  {...register("surname")}
                />
                {errors.surname && (
                  <p id="settings-surname-error" className="text-xs text-destructive">
                    {t(`settings.validation.${errors.surname.message}`)}
                  </p>
                )}
              </div>
            </div>

            {/* Middle name */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-middle-name">{t("settings.middleName")}</Label>
              <Input
                id="settings-middle-name"
                type="text"
                autoComplete="additional-name"
                {...register("middle_name")}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-email">{t("settings.email")}</Label>
              <Input
                id="settings-email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "settings-email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="settings-email-error" className="text-xs text-destructive">
                  {t(`settings.validation.${errors.email.message}`)}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-phone">{t("settings.phone")}</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    id="settings-phone"
                    autoComplete="tel"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "settings-phone-error" : undefined}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.phone && (
                <p id="settings-phone-error" className="text-xs text-destructive">
                  {t(`settings.validation.${errors.phone.message}`)}
                </p>
              )}
            </div>
          </fieldset>

          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("settings.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
