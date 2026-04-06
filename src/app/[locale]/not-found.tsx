"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-7xl font-bold text-black">404</p>
      <h1 className="text-xl font-semibold text-zinc-900">
        {t("common.notFound")}
      </h1>
      <p className="text-sm text-zinc-500">{t("common.notFoundDescription")}</p>
      <Link
        href="/"
        className={cn(buttonVariants(), "mt-2 bg-black text-white hover:bg-zinc-800")}
      >
        {t("common.backHome")}
      </Link>
    </div>
  );
}
