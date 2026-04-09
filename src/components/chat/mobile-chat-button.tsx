"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatPanel } from "./chat-panel";
import type { ChatSide } from "@/types/chat";

interface MobileChatButtonProps {
  orderId: string;
  side: ChatSide;
  orgId?: string;
  translationPrefix: "orders" | "orgOrders";
  unreadCount?: number;
}

export function MobileChatButton({
  orderId,
  side,
  orgId,
  translationPrefix,
  unreadCount = 0,
}: MobileChatButtonProps) {
  const t = useTranslations(translationPrefix);
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 lg:hidden z-40">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button size="icon" className="size-14 rounded-full shadow-lg relative">
              <MessageCircle className="size-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center size-5 rounded-full bg-red-500 dark:bg-red-400 text-[10px] text-white font-medium">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          }
        />
        <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
          <SheetTitle className="sr-only">{t("chat.title")}</SheetTitle>
          <div className="flex-1 min-h-0">
            <ChatPanel
              orderId={orderId}
              side={side}
              orgId={orgId}
              translationPrefix={translationPrefix}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
