"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { ApiRequestError } from "@/lib/api/client";
import { registerSchema, type RegisterFormData } from "@/lib/validators/auth";
import { AvatarUpload } from "@/components/media/avatar-upload";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [profilePhotoId, setProfilePhotoId] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleAvatarUploaded = useCallback((mediaId: string, url: string) => {
    setProfilePhotoId(mediaId);
    setCurrentPhotoUrl(url);
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    setGlobalError(null);
    try {
      await registerUser({
        name: data.name,
        surname: data.surname,
        middle_name: data.middle_name || null,
        email: data.email,
        phone: data.phone,
        password: data.password,
        profile_photo_id: profilePhotoId,
      });
      router.push("/");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError("email", { message: t("auth.emailTaken") });
      } else {
        setGlobalError(t("common.error"));
      }
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h1 className="mb-6 text-xl font-semibold">{t("auth.register")}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Avatar upload */}
          <div className="flex justify-center">
            <AvatarUpload
              onUploaded={handleAvatarUploaded}
              currentUrl={currentPhotoUrl}
            />
          </div>

          {globalError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {globalError}
            </p>
          )}

          {/* Name + Surname row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input
                id="name"
                type="text"
                autoComplete="given-name"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="surname">{t("auth.surname")}</Label>
              <Input
                id="surname"
                type="text"
                autoComplete="family-name"
                aria-invalid={!!errors.surname}
                {...register("surname")}
              />
              {errors.surname && (
                <p className="text-xs text-destructive">{errors.surname.message}</p>
              )}
            </div>
          </div>

          {/* Middle name */}
          <div className="space-y-1.5">
            <Label htmlFor="middle_name">{t("auth.middleName")}</Label>
            <Input
              id="middle_name"
              type="text"
              autoComplete="additional-name"
              aria-invalid={!!errors.middle_name}
              {...register("middle_name")}
            />
            {errors.middle_name && (
              <p className="text-xs text-destructive">{errors.middle_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("auth.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+7"
              aria-invalid={!!errors.phone}
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-black/90"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("auth.register")}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm">
        <p className="text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            {t("auth.login")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
