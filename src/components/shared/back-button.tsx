"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  const t = useTranslations("common");

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black"
    >
      <ArrowLeft className="size-4" />
      {t("back")}
    </button>
  );
}
