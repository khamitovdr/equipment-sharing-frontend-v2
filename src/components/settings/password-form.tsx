"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useChangePassword } from "@/lib/hooks/use-change-password";
import { useApiErrorToast } from "@/lib/hooks/use-api-error-toast";
import { ApiRequestError } from "@/lib/api/client";
import {
  passwordChangeSchema,
  type PasswordChangeFormData,
} from "@/lib/validators/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PasswordForm() {
  const t = useTranslations();
  const changePassword = useChangePassword();
  const toastError = useApiErrorToast();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema) as Resolver<PasswordChangeFormData>,
    defaultValues: {
      password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: PasswordChangeFormData) => {
    try {
      await changePassword.mutateAsync({
        password: data.password,
        new_password: data.new_password,
      });
      reset();
      toast.success(t("settings.success.password"));
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        (err.status === 401 || err.status === 403)
      ) {
        setError("password", { message: "wrongPassword" });
      } else {
        toastError(err);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.password.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <fieldset className="space-y-4">
            <legend className="sr-only">{t("settings.password.title")}</legend>

            {/* Current password */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-current-password">
                {t("settings.password.current")}
              </Label>
              <PasswordInput
                id="settings-current-password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "settings-current-password-error" : undefined
                }
                {...register("password")}
              />
              {errors.password && (
                <p
                  id="settings-current-password-error"
                  className="text-xs text-destructive"
                >
                  {t(`settings.validation.${errors.password.message}`)}
                </p>
              )}
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-new-password">
                {t("settings.password.new")}
              </Label>
              <PasswordInput
                id="settings-new-password"
                autoComplete="new-password"
                aria-invalid={!!errors.new_password}
                aria-describedby={
                  errors.new_password ? "settings-new-password-error" : undefined
                }
                {...register("new_password")}
              />
              {errors.new_password && (
                <p
                  id="settings-new-password-error"
                  className="text-xs text-destructive"
                >
                  {t(`settings.validation.${errors.new_password.message}`)}
                </p>
              )}
            </div>

            {/* Confirm new password */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-confirm-password">
                {t("settings.password.confirm")}
              </Label>
              <PasswordInput
                id="settings-confirm-password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirm_password}
                aria-describedby={
                  errors.confirm_password
                    ? "settings-confirm-password-error"
                    : undefined
                }
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <p
                  id="settings-confirm-password-error"
                  className="text-xs text-destructive"
                >
                  {t(`settings.validation.${errors.confirm_password.message}`)}
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
            {t("settings.password.update")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
