"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "@/types/chat";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  offered: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  accepted: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  active: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  finished: "bg-muted text-muted-foreground border-border",
  canceled_by_user: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  canceled_by_organization: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  expired: "bg-muted text-muted-foreground border-border",
};

interface NotificationBannerProps {
  message: ChatMessage;
  translationPrefix: "orders" | "orgOrders";
}

export function NotificationBanner({ message, translationPrefix }: NotificationBannerProps) {
  const t = useTranslations(translationPrefix);

  if (message.notification_type !== "status_changed" || !message.notification_body) {
    return null;
  }

  const { new_status } = message.notification_body;
  const style = statusStyles[new_status] ?? "bg-muted text-muted-foreground border-border";

  return (
    <div className="flex justify-center py-2">
      <Badge variant="outline" className={style}>
        {t(`chat.notification.${new_status}`)}
      </Badge>
    </div>
  );
}
