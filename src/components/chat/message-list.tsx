"use client";

import { useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat-store";
import { MessageBubble } from "./message-bubble";
import { PendingBubble } from "./pending-bubble";
import { NotificationBanner } from "./notification-banner";
import { TypingIndicator } from "./typing-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatSide, ChatMessage } from "@/types/chat";

interface MessageListProps {
  currentSide: ChatSide;
  translationPrefix: "orders" | "orgOrders";
  onLoadMore: () => void;
  onMessagesViewed: (lastMessageId: string) => void;
}

function findLastReadIndex(messages: ChatMessage[], currentSide: ChatSide): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].side === currentSide && messages[i].read_at) {
      return i;
    }
  }
  return -1;
}

export function MessageList({
  currentSide,
  translationPrefix,
  onLoadMore,
  onMessagesViewed,
}: MessageListProps) {
  const t = useTranslations(translationPrefix);
  const messages = useChatStore((s) => s.messages);
  const pendingMessages = useChatStore((s) => s.pendingMessages);
  const otherSideTyping = useChatStore((s) => s.otherSideTyping);
  const hasMore = useChatStore((s) => s.hasMore);
  const connectionStatus = useChatStore((s) => s.connectionStatus);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    const totalCount = messages.length + pendingMessages.length;
    if (totalCount > prevMessageCountRef.current && isAtBottomRef.current) {
      // Wait for DOM update before scrolling
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    }
    prevMessageCountRef.current = totalCount;
  }, [messages.length, pendingMessages.length]);

  useEffect(() => {
    if (!isAtBottomRef.current) return;
    const lastOtherMessage = [...messages]
      .reverse()
      .find((m) => m.side !== currentSide && !m.read_at);
    if (lastOtherMessage) {
      onMessagesViewed(lastOtherMessage.id);
    }
  }, [messages, currentSide, onMessagesViewed]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;

    if (el.scrollTop < 50 && hasMore && connectionStatus === "connected" && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      Promise.resolve(onLoadMore()).finally(() => {
        isLoadingMoreRef.current = false;
      });
    }
  }, [hasMore, connectionStatus, onLoadMore]);

  const lastReadIdx = findLastReadIndex(messages, currentSide);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1.5"
      onScroll={handleScroll}
    >
      {hasMore && (
        <div className="flex justify-center py-2">
          <Skeleton className="h-4 w-32" />
        </div>
      )}

      {messages.length === 0 && pendingMessages.length === 0 && !hasMore && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-zinc-400">
          <MessageCircle className="size-10 text-zinc-300" />
          <p className="text-sm">{t("chat.sendFirst")}</p>
        </div>
      )}

      {messages.map((msg, i) => {
        if (msg.message_type === "notification") {
          return (
            <NotificationBanner
              key={msg.id}
              message={msg}
              translationPrefix={translationPrefix}
            />
          );
        }
        const prev = messages[i - 1];
        const isGrouped = prev != null
          && prev.message_type === "user"
          && prev.side === msg.side;
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            currentSide={currentSide}
            showReadReceipt={i === lastReadIdx}
            showName={!isGrouped}
            translationPrefix={translationPrefix}
          />
        );
      })}

      {pendingMessages.map((msg) => (
        <PendingBubble
          key={msg.tempId}
          message={msg}
          translationPrefix={translationPrefix}
        />
      ))}

      {otherSideTyping && <TypingIndicator translationPrefix={translationPrefix} />}
    </div>
  );
}
