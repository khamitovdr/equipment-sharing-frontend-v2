"use client";

import { useTranslations } from "next-intl";
import { Check, CheckCheck } from "lucide-react";

interface ReadReceiptProps {
  isRead: boolean;
  translationPrefix: "orders" | "orgOrders";
}

export function ReadReceipt({ isRead, translationPrefix }: ReadReceiptProps) {
  const t = useTranslations(translationPrefix);

  if (isRead) {
    return (
      <span className="inline-flex items-center gap-0.5 text-blue-500 dark:text-blue-400" title={t("chat.read")}>
        <CheckCheck className="size-3.5" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground">
      <Check className="size-3.5" />
    </span>
  );
}
