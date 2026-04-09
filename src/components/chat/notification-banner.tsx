"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "@/types/chat";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  offered: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-indigo-100 text-indigo-800 border-indigo-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  active: "bg-green-100 text-green-800 border-green-200",
  finished: "bg-zinc-100 text-zinc-600 border-zinc-200",
  canceled_by_user: "bg-red-100 text-red-800 border-red-200",
  canceled_by_organization: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-zinc-100 text-zinc-500 border-zinc-200",
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
  const style = statusStyles[new_status] ?? "bg-zinc-100 text-zinc-600 border-zinc-200";

  return (
    <div className="flex justify-center py-2">
      <Badge variant="outline" className={style}>
        {t(`chat.notification.${new_status}`)}
      </Badge>
    </div>
  );
}
