"use client";

import { useTranslations } from "next-intl";

interface TypingIndicatorProps {
  translationPrefix: "orders" | "orgOrders";
}

export function TypingIndicator({ translationPrefix }: TypingIndicatorProps) {
  const t = useTranslations(translationPrefix);

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground">
      <span className="flex gap-0.5">
        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
      </span>
      <span>{t("chat.typing")}</span>
    </div>
  );
}
