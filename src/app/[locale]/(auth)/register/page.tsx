"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { usersApi } from "@/lib/api/users";
import { mediaApi } from "@/lib/api/media";
import { ApiRequestError } from "@/lib/api/client";
import { registerSchema, type RegisterFormData } from "@/lib/validators/auth";
import { AvatarUpload } from "@/components/media/avatar-upload";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/shared/phone-input";

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "processing" | "ready" | "failed">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  async function uploadPhoto(token: string, file: File): Promise<string | null> {
    try {
      setUploadState("uploading");
      setUploadProgress(0);

      // 1. Get presigned URL
      const { media_id, upload_url } = await mediaApi.requestUploadUrl(token, {
        kind: "photo",
        context: "user_profile",
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
      });

      // 2. Upload via XHR for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () =>
          xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed"))
        );
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // 3. Confirm
      await mediaApi.confirm(token, media_id);
      setUploadState("processing");

      // 4. Poll until ready
      while (true) {
        const status = await mediaApi.status(token, media_id);
        if (status.status === "ready") {
          setUploadState("ready");
          return media_id;
        }
        if (status.status === "failed") {
          setUploadState("failed");
          return null;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch {
      setUploadState("failed");
      return null;
    }
  }

  const onSubmit = async (data: RegisterFormData) => {
    setGlobalError(null);
    try {
      // Step 1: Register and get token
      const { access_token } = await registerUser({
        name: data.name,
        surname: data.surname,
        middle_name: data.middle_name || null,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      // Step 2: If photo selected, upload with fresh token and patch profile
      if (selectedFile && access_token) {
        const mediaId = await uploadPhoto(access_token, selectedFile);
        if (mediaId) {
          await usersApi.update(access_token, { profile_photo_id: mediaId });
        }
      }

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
          {/* Avatar — file stored locally, uploaded after registration */}
          <div className="flex justify-center">
            <AvatarUpload
              onFileSelected={handleFileSelected}
              uploadState={uploadState}
              uploadProgress={uploadProgress}
            />
          </div>

          {globalError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {globalError}
            </p>
          )}

          {/* Name + Surname */}
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
              {...register("middle_name")}
            />
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
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  id="phone"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">
                {t(`settings.validation.${errors.phone.message}`)}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {t(`settings.validation.${errors.password.message}`)}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">{t("auth.confirmPassword")}</Label>
            <PasswordInput
              id="confirm_password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirm_password}
              {...register("confirm_password")}
            />
            {errors.confirm_password && (
              <p className="text-xs text-destructive">
                {t(`settings.validation.${errors.confirm_password.message}`)}
              </p>
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
