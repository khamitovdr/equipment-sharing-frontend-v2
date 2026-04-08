"use client";

import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";

interface ChatPlaceholderProps {
  translationPrefix: "orders" | "orgOrders";
}

export function ChatPlaceholder({ translationPrefix }: ChatPlaceholderProps) {
  const t = useTranslations(translationPrefix);

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center min-h-[400px]">
      <MessageCircle className="size-10 text-zinc-300 mb-3" />
      <p className="text-sm font-medium text-zinc-500">
        {t("chat.comingSoon")}
      </p>
      <p className="text-xs text-zinc-400 mt-1">
        {t("chat.comingSoonDescription")}
      </p>
    </div>
  );
}
