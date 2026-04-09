// src/types/chat.ts

export type ChatStatus = "active" | "read_only";
export type ChatSide = "requester" | "organization";
export type MessageType = "user" | "notification";
export type NotificationType = "status_changed";

export interface ChatMedia {
  id: string;
  kind: "photo" | "video" | "document";
  urls: { thumbnail?: string; large: string };
  original_filename: string;
  content_type: string;
}

export interface ChatMessage {
  id: string;
  side: ChatSide;
  name: string | null;
  text: string | null;
  media: ChatMedia[];
  message_type: MessageType;
  notification_type: NotificationType | null;
  notification_body: { old_status: string; new_status: string } | null;
  created_at: string;
  read_at: string | null;
}

export interface ChatMessagesResponse {
  items: ChatMessage[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface ChatStatusResponse {
  status: ChatStatus;
  unread_count: number;
}

// Client → Server frames
export type ClientFrame =
  | { type: "message"; text?: string; media_ids?: string[] }
  | { type: "typing"; is_typing: boolean }
  | { type: "read"; until_message_id: string };

// Server → Client frames
export type ServerFrame =
  | { type: "connected"; data: { chat_status: ChatStatus } }
  | { type: "message"; data: ChatMessage }
  | { type: "notification"; data: ChatMessage }
  | { type: "typing"; data: { side: ChatSide; is_typing: boolean } }
  | { type: "read"; data: { side: ChatSide; until_message_id: string } }
  | { type: "error"; data: { code: string; detail: string } };

export interface PendingMessage {
  tempId: string;
  text?: string;
  media_ids?: string[];
  status: "sending" | "failed";
}
