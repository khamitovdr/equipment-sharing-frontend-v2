"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useChatStore } from "@/lib/stores/chat-store";
import { chatApi } from "@/lib/api/chat";
import { toast } from "sonner";
import type { ChatSide, ServerFrame, ClientFrame } from "@/types/chat";

const PERMANENT_CLOSE_CODES = [4001, 4003, 4004];
const MAX_BACKOFF_MS = 30_000;

function getWsUrl(orderId: string, token: string): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_WS_URL || "wss://api.equip-me.ru/api/v1";
  return `${apiUrl}/orders/${orderId}/chat/ws?token=${token}`;
}

export function useChat(orderId: string, side: ChatSide, orgId?: string) {
  const token = useAuthStore((s) => s.token);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1000);
  const mountedRef = useRef(true);

  const store = useChatStore;

  const send = useCallback(
    (frame: ClientFrame) => {
      // readyState 1 === OPEN (avoids referencing WebSocket.OPEN which may be
      // undefined when the global is mocked in tests)
      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify(frame));
      }
    },
    []
  );

  const loadHistory = useCallback(
    async (cursor?: string | null) => {
      if (!token) return;
      try {
        const res =
          side === "organization" && orgId
            ? await chatApi.orgGetMessages(token, orgId, orderId, { cursor, limit: 20 })
            : await chatApi.getMessages(token, orderId, { cursor, limit: 20 });

        if (mountedRef.current) {
          store.getState().prependHistory(res.items, res.next_cursor, res.has_more);
        }
      } catch {
        // REST errors silently ignored on reconnect gap-fill
      }
    },
    [token, orderId, side, orgId, store]
  );

  // Use a ref for connect to avoid circular useCallback dependency
  const connectRef = useRef<() => void>(undefined);

  connectRef.current = () => {
    if (!token || !mountedRef.current) return;

    // Close any existing connection (StrictMode double-mount safety)
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    store.getState().setConnectionStatus("connecting");

    const ws = new WebSocket(getWsUrl(orderId, token));
    wsRef.current = ws;

    ws.onopen = () => {};

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      let frame: ServerFrame;
      try {
        frame = JSON.parse(event.data) as ServerFrame;
      } catch {
        return;
      }

      const s = store.getState();

      switch (frame.type) {
        case "connected":
          s.setConnectionStatus("connected");
          s.setChatStatus(frame.data.chat_status);
          backoffRef.current = 1000;
          break;
        case "message":
        case "notification":
          s.addMessage(frame.data);
          break;
        case "typing":
          s.setOtherSideTyping(frame.data.is_typing);
          break;
        case "read":
          s.updateReadReceipt(frame.data.until_message_id);
          break;
        case "error":
          switch (frame.data.code) {
            case "rate_limited":
              toast.error(frame.data.detail);
              break;
            case "read_only":
              s.setChatStatus("read_only");
              break;
            case "validation_error":
              toast.error(frame.data.detail);
              {
                const pending = s.pendingMessages.findLast((p) => p.status === "sending");
                if (pending) s.markPendingFailed(pending.tempId);
              }
              break;
            case "invalid_json":
              console.error("Chat: sent invalid JSON", frame.data.detail);
              break;
          }
          break;
      }
    };

    ws.onclose = (event) => {
      if (!mountedRef.current) return;

      store.getState().setConnectionStatus("disconnected");

      if (PERMANENT_CLOSE_CODES.includes(event.code)) {
        store.getState().setConnectionStatus("error");
        if (event.code === 4001) {
          useAuthStore.getState().clearAuth();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
        return;
      }

      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
          connectRef.current?.();
          loadHistory();
        }
      }, backoffRef.current);
    };

    ws.onerror = () => {};
  };

  useEffect(() => {
    mountedRef.current = true;
    connectRef.current?.();
    loadHistory();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      store.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, token]);

  const sendMessage = useCallback(
    (text?: string, mediaIds?: string[]) => {
      const tempId = crypto.randomUUID();
      store.getState().addPendingMessage({
        tempId,
        text,
        media_ids: mediaIds,
        status: "sending",
      });
      send({ type: "message", text, media_ids: mediaIds });
    },
    [send, store]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      send({ type: "typing", is_typing: isTyping });
    },
    [send]
  );

  const markAsRead = useCallback(
    (untilMessageId: string) => {
      send({ type: "read", until_message_id: untilMessageId });
    },
    [send]
  );

  const loadMoreHistory = useCallback(() => {
    const cursor = store.getState().nextCursor;
    return loadHistory(cursor);
  }, [loadHistory, store]);

  return {
    sendMessage,
    sendTyping,
    markAsRead,
    loadMoreHistory,
    chatStatus: useChatStore((s) => s.chatStatus),
    connectionStatus: useChatStore((s) => s.connectionStatus),
  };
}
