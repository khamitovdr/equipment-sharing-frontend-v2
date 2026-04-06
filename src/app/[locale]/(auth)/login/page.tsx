"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { ApiRequestError } from "@/lib/api/client";
import { loginSchema, type LoginFormData } from "@/lib/validators/auth";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setGlobalError(null);
    try {
      await login(data);
      const returnTo = searchParams.get("returnTo") || "/";
      router.push(returnTo);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setGlobalError(t("auth.loginError"));
      } else {
        setGlobalError(t("common.error"));
      }
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h1 className="mb-6 text-xl font-semibold">{t("auth.login")}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {globalError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {globalError}
            </p>
          )}

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

          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
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
            {t("auth.login")}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm">
        <p className="text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            {t("auth.register")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
