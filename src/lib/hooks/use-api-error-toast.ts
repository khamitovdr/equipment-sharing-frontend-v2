"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toastApiError } from "@/lib/api/toast-error";

export function useApiErrorToast() {
  const t = useTranslations();
  return useCallback(
    (err: unknown, fallback?: string) => {
      toastApiError(err, fallback ?? t("common.error"), {
        traceIdLabel: t("errors.traceIdLabel"),
        copyTraceId: t("errors.copyTraceId"),
        traceIdCopied: t("errors.traceIdCopied"),
      });
    },
    [t]
  );
}
