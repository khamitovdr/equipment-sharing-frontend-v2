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
      className="inline-flex items-center gap-2 rounded-md px-3 py-2 -ml-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <ArrowLeft className="size-4" />
      {t("back")}
    </button>
  );
}
