"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { IN_APP_NAV_STORAGE_KEY } from "./navigation-tracker";

function getClientVisible() {
  if (sessionStorage.getItem(IN_APP_NAV_STORAGE_KEY) === "1") return true;
  const referrer = document.referrer;
  if (!referrer) return false;
  try {
    return new URL(referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

export function BackButton() {
  const router = useRouter();
  const t = useTranslations("common");
  const visible = useSyncExternalStore(noopSubscribe, getClientVisible, () => false);

  if (!visible) return null;

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
