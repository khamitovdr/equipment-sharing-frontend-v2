"use client";

import { cn } from "@/lib/utils";
import { MediaAttachment } from "./media-attachment";
import { ReadReceipt } from "./read-receipt";
import type { ChatMessage, ChatSide } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  currentSide: ChatSide;
  showReadReceipt: boolean;
  showName?: boolean;
  translationPrefix: "orders" | "orgOrders";
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({
  message,
  currentSide,
  showReadReceipt,
  showName = true,
  translationPrefix,
}: MessageBubbleProps) {
  const isMine = message.side === currentSide;

  return (
    <div className={cn("flex flex-col gap-0.5 max-w-[80%]", isMine ? "self-end items-end" : "self-start items-start")}>
      {!isMine && showName && message.name && (
        <span className="text-xs text-zinc-500 px-1">{message.name}</span>
      )}
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2 text-sm break-words",
          isMine
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-900"
        )}
      >
        {message.media.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-1.5">
            {message.media.map((m) => (
              <MediaAttachment key={m.id} media={m} />
            ))}
          </div>
        )}
        {message.text && <p>{message.text}</p>}
      </div>
      <div className="flex items-center gap-1 px-1">
        <span className="text-[10px] text-zinc-400">
          {formatTime(message.created_at)}
        </span>
        {isMine && showReadReceipt && (
          <ReadReceipt isRead={!!message.read_at} translationPrefix={translationPrefix} />
        )}
      </div>
    </div>
  );
}
