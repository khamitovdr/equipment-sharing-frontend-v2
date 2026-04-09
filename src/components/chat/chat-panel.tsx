"use client";

import { useCallback } from "react";
import { useChat } from "@/lib/hooks/use-chat";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import type { ChatSide } from "@/types/chat";

interface ChatPanelProps {
  orderId: string;
  side: ChatSide;
  orgId?: string;
  translationPrefix: "orders" | "orgOrders";
}

export function ChatPanel({ orderId, side, orgId, translationPrefix }: ChatPanelProps) {
  const {
    sendMessage,
    sendTyping,
    markAsRead,
    loadMoreHistory,
    chatStatus,
    connectionStatus,
  } = useChat(orderId, side, orgId);

  const handleMessagesViewed = useCallback(
    (lastMessageId: string) => {
      markAsRead(lastMessageId);
    },
    [markAsRead]
  );

  return (
    <div className="flex flex-col rounded-lg border bg-white h-[600px] lg:h-[calc(100vh-8rem)] lg:sticky lg:top-4">
      <ChatHeader
        connectionStatus={connectionStatus}
        translationPrefix={translationPrefix}
      />
      <MessageList
        currentSide={side}
        translationPrefix={translationPrefix}
        onLoadMore={loadMoreHistory}
        onMessagesViewed={handleMessagesViewed}
      />
      <ChatInput
        chatStatus={chatStatus}
        onSendMessage={sendMessage}
        onTyping={sendTyping}
        translationPrefix={translationPrefix}
      />
    </div>
  );
}
