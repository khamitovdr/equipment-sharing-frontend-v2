"use client";

import { useTranslations } from "next-intl";

interface ChatHeaderProps {
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  translationPrefix: "orders" | "orgOrders";
}

export function ChatHeader({ connectionStatus, translationPrefix }: ChatHeaderProps) {
  const t = useTranslations(translationPrefix);

  if (connectionStatus === "connected") return null;

  return (
    <div className="flex items-center justify-end border-b px-4 py-2">
      {connectionStatus === "connecting" && (
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
          {t("chat.connecting")}
        </span>
      )}

      {connectionStatus === "disconnected" && (
        <span className="flex items-center gap-1.5 text-xs text-yellow-600">
          <span className="size-1.5 rounded-full bg-yellow-500" />
          {t("chat.reconnecting")}
        </span>
      )}

      {connectionStatus === "error" && (
        <span className="flex items-center gap-1.5 text-xs text-red-500">
          <span className="size-1.5 rounded-full bg-red-500" />
          {t("chat.connectionError")}
        </span>
      )}
    </div>
  );
}
