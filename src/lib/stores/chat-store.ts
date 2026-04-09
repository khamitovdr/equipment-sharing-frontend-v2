import { create } from "zustand";
import type { ChatMessage, ChatStatus, PendingMessage } from "@/types/chat";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface ChatState {
  messages: ChatMessage[];
  pendingMessages: PendingMessage[];
  chatStatus: ChatStatus | null;
  connectionStatus: ConnectionStatus;
  otherSideTyping: boolean;
  hasMore: boolean;
  nextCursor: string | null;

  addMessage: (msg: ChatMessage) => void;
  addPendingMessage: (pending: PendingMessage) => void;
  markPendingFailed: (tempId: string) => void;
  prependHistory: (items: ChatMessage[], cursor: string | null, hasMore: boolean) => void;
  updateReadReceipt: (untilMessageId: string) => void;
  setOtherSideTyping: (value: boolean) => void;
  setChatStatus: (status: ChatStatus) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  reset: () => void;
}

const initialState = {
  messages: [] as ChatMessage[],
  pendingMessages: [] as PendingMessage[],
  chatStatus: null as ChatStatus | null,
  connectionStatus: "disconnected" as ConnectionStatus,
  otherSideTyping: false,
  hasMore: true,
  nextCursor: null as string | null,
};

export const useChatStore = create<ChatState>()((set) => ({
  ...initialState,

  addMessage: (msg) =>
    set((state) => {
      // Skip if message with this ID already exists (WS echo + REST overlap)
      if (state.messages.some((m) => m.id === msg.id)) return state;

      const pendingIdx = state.pendingMessages.findIndex((p) => {
        if (p.status !== "sending") return false;
        const textMatch = (p.text ?? "") === (msg.text ?? "");
        const pendingMediaIds = [...(p.media_ids ?? [])].sort();
        const msgMediaIds = msg.media.map((m) => m.id).sort();
        const mediaMatch =
          pendingMediaIds.length === msgMediaIds.length &&
          pendingMediaIds.every((id, i) => id === msgMediaIds[i]);
        return textMatch && mediaMatch;
      });

      const pendingMessages =
        pendingIdx >= 0
          ? state.pendingMessages.filter((_, i) => i !== pendingIdx)
          : state.pendingMessages;

      return {
        messages: [...state.messages, msg],
        pendingMessages,
      };
    }),

  addPendingMessage: (pending) =>
    set((state) => ({
      pendingMessages: [...state.pendingMessages, pending],
    })),

  markPendingFailed: (tempId) =>
    set((state) => ({
      pendingMessages: state.pendingMessages.map((p) =>
        p.tempId === tempId ? { ...p, status: "failed" as const } : p
      ),
    })),

  prependHistory: (items, cursor, hasMore) =>
    set((state) => {
      const existingIds = new Set(state.messages.map((m) => m.id));
      const newItems = [...items].reverse().filter((m) => !existingIds.has(m.id));
      return {
        messages: [...newItems, ...state.messages],
        nextCursor: cursor,
        hasMore,
      };
    }),

  updateReadReceipt: (untilMessageId) =>
    set((state) => {
      const targetIdx = state.messages.findIndex((m) => m.id === untilMessageId);
      if (targetIdx < 0) return state;
      const now = new Date().toISOString();
      return {
        messages: state.messages.map((m, i) =>
          i <= targetIdx && !m.read_at ? { ...m, read_at: now } : m
        ),
      };
    }),

  setOtherSideTyping: (value) => set({ otherSideTyping: value }),
  setChatStatus: (status) => set({ chatStatus: status }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  reset: () => set(initialState),
}));
