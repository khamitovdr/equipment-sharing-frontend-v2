"use client";

import { useTranslations } from "next-intl";
import type { PendingMessage } from "@/types/chat";

interface PendingBubbleProps {
  message: PendingMessage;
  translationPrefix: "orders" | "orgOrders";
  onRetry?: (message: PendingMessage) => void;
}

export function PendingBubble({ message, translationPrefix, onRetry }: PendingBubbleProps) {
  const t = useTranslations(translationPrefix);

  return (
    <div className="flex flex-col gap-0.5 max-w-[80%] self-end items-end">
      <div className="rounded-2xl px-3.5 py-2 text-sm bg-zinc-900 text-white opacity-70 break-words">
        {message.text && <p>{message.text}</p>}
      </div>
      <div className="flex items-center gap-1 px-1">
        {message.status === "sending" && (
          <span className="text-[10px] text-muted-foreground">{t("chat.sending")}</span>
        )}
        {message.status === "failed" && (
          <span className="flex items-center gap-1">
            <span className="text-[10px] text-red-500 dark:text-red-400">{t("chat.sendFailed")}</span>
            {onRetry && (
              <button
                onClick={() => onRetry(message)}
                className="text-[10px] text-blue-500 dark:text-blue-400 hover:underline"
              >
                {t("chat.retry")}
              </button>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
