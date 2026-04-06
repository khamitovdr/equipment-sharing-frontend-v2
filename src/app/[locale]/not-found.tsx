"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-7xl font-bold text-black">404</p>
      <h1 className="text-xl font-semibold text-zinc-900">
        {t("common.notFound")}
      </h1>
      <p className="text-sm text-zinc-500">{t("common.notFoundDescription")}</p>
      <Button
        className="mt-2 bg-black text-white hover:bg-zinc-800"
        nativeButton={false} render={<Link href="/" />}
      >
        {t("common.backHome")}
      </Button>
    </div>
  );
}
