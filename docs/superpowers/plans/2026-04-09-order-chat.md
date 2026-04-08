# Order Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real-time order-scoped chat between requester and organization, replacing the `ChatPlaceholder` with a full messaging interface.

**Architecture:** Zustand store (ephemeral, not persisted) for chat state, raw WebSocket for real-time messaging, TanStack Query for REST history/status, existing `mediaApi` for file uploads. Chat connects directly to `wss://api.equip-me.ru` (not through Next.js proxy).

**Tech Stack:** Next.js 16, React 19, Zustand 5, TanStack Query 5, native WebSocket, shadcn/ui (base-ui), Tailwind v4, next-intl, Vitest

**Spec:** `docs/superpowers/specs/2026-04-09-order-chat-design.md`
**Backend contract:** `docs/chat-integration-guide.md`

---

### Task 1: Chat Types

**Files:**
- Create: `src/types/chat.ts`

- [ ] **Step 1: Create the chat types file**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `src/types/chat.ts`

- [ ] **Step 3: Commit**

```bash
git add src/types/chat.ts
git commit -m "feat(chat): add chat types"
```

---

### Task 2: Chat API Client

**Files:**
- Create: `src/lib/api/chat.ts`
- Test: `src/lib/api/__tests__/chat.test.ts`

- [ ] **Step 1: Write tests for chat API**

```typescript
// src/lib/api/__tests__/chat.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the client module
vi.mock("../client", () => ({
  apiClient: vi.fn(),
}));

import { chatApi } from "../chat";
import { apiClient } from "../client";

const mockApiClient = vi.mocked(apiClient);

describe("chatApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMessages", () => {
    it("calls correct requester endpoint with params", async () => {
      mockApiClient.mockResolvedValue({ items: [], next_cursor: null, has_more: false });
      await chatApi.getMessages("tok", "order-1", { cursor: "abc", limit: 20 });
      expect(mockApiClient).toHaveBeenCalledWith("/orders/order-1/chat/messages", {
        params: { cursor: "abc", limit: 20 },
        token: "tok",
      });
    });
  });

  describe("getStatus", () => {
    it("calls correct requester endpoint", async () => {
      mockApiClient.mockResolvedValue({ status: "active", unread_count: 0 });
      await chatApi.getStatus("tok", "order-1");
      expect(mockApiClient).toHaveBeenCalledWith("/orders/order-1/chat/status", {
        token: "tok",
      });
    });
  });

  describe("orgGetMessages", () => {
    it("calls correct org endpoint with params", async () => {
      mockApiClient.mockResolvedValue({ items: [], next_cursor: null, has_more: false });
      await chatApi.orgGetMessages("tok", "org-1", "order-1", { cursor: "abc", limit: 20 });
      expect(mockApiClient).toHaveBeenCalledWith(
        "/organizations/org-1/orders/order-1/chat/messages",
        { params: { cursor: "abc", limit: 20 }, token: "tok" }
      );
    });
  });

  describe("orgGetStatus", () => {
    it("calls correct org endpoint", async () => {
      mockApiClient.mockResolvedValue({ status: "active", unread_count: 3 });
      await chatApi.orgGetStatus("tok", "org-1", "order-1");
      expect(mockApiClient).toHaveBeenCalledWith(
        "/organizations/org-1/orders/order-1/chat/status",
        { token: "tok" }
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/api/__tests__/chat.test.ts 2>&1 | tail -15`
Expected: FAIL — module `../chat` not found

- [ ] **Step 3: Implement the chat API client**

```typescript
// src/lib/api/chat.ts
import { apiClient } from "./client";
import type { ChatMessagesResponse, ChatStatusResponse } from "@/types/chat";

interface ChatMessagesParams {
  cursor?: string | null;
  limit?: number;
}

export const chatApi = {
  getMessages(token: string, orderId: string, params?: ChatMessagesParams) {
    return apiClient<ChatMessagesResponse>(`/orders/${orderId}/chat/messages`, {
      params: params as Record<string, string | number | boolean | null | undefined>,
      token,
    });
  },

  getStatus(token: string, orderId: string) {
    return apiClient<ChatStatusResponse>(`/orders/${orderId}/chat/status`, {
      token,
    });
  },

  orgGetMessages(token: string, orgId: string, orderId: string, params?: ChatMessagesParams) {
    return apiClient<ChatMessagesResponse>(
      `/organizations/${orgId}/orders/${orderId}/chat/messages`,
      {
        params: params as Record<string, string | number | boolean | null | undefined>,
        token,
      }
    );
  },

  orgGetStatus(token: string, orgId: string, orderId: string) {
    return apiClient<ChatStatusResponse>(
      `/organizations/${orgId}/orders/${orderId}/chat/status`,
      { token }
    );
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/api/__tests__/chat.test.ts 2>&1 | tail -15`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/chat.ts src/lib/api/__tests__/chat.test.ts
git commit -m "feat(chat): add chat REST API client"
```

---

### Task 3: Chat Store

**Files:**
- Create: `src/lib/stores/chat-store.ts`
- Test: `src/lib/stores/__tests__/chat-store.test.ts`

- [ ] **Step 1: Write tests for the chat store**

```typescript
// src/lib/stores/__tests__/chat-store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "../chat-store";
import type { ChatMessage } from "@/types/chat";

const makeMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "msg-1",
  side: "requester",
  name: "Иван",
  text: "Hello",
  media: [],
  message_type: "user",
  notification_type: null,
  notification_body: null,
  created_at: "2026-04-01T12:00:00Z",
  read_at: null,
  ...overrides,
});

describe("useChatStore", () => {
  beforeEach(() => {
    useChatStore.getState().reset();
  });

  it("starts with empty state", () => {
    const s = useChatStore.getState();
    expect(s.messages).toEqual([]);
    expect(s.pendingMessages).toEqual([]);
    expect(s.chatStatus).toBeNull();
    expect(s.connectionStatus).toBe("disconnected");
    expect(s.otherSideTyping).toBe(false);
    expect(s.hasMore).toBe(true);
    expect(s.nextCursor).toBeNull();
  });

  it("addMessage appends a message", () => {
    const msg = makeMessage();
    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().messages).toEqual([msg]);
  });

  it("addMessage removes matching pending message", () => {
    const store = useChatStore.getState();
    store.addPendingMessage({ tempId: "tmp-1", text: "Hello", status: "sending" });
    expect(useChatStore.getState().pendingMessages).toHaveLength(1);

    store.addMessage(makeMessage({ text: "Hello" }));
    expect(useChatStore.getState().pendingMessages).toHaveLength(0);
  });

  it("addMessage removes matching pending with media_ids", () => {
    const store = useChatStore.getState();
    store.addPendingMessage({ tempId: "tmp-1", text: "Photo", media_ids: ["m1", "m2"], status: "sending" });

    const msg = makeMessage({ text: "Photo", media: [
      { id: "m1", kind: "photo", urls: { large: "x" }, original_filename: "a.jpg", content_type: "image/jpeg" },
      { id: "m2", kind: "photo", urls: { large: "y" }, original_filename: "b.jpg", content_type: "image/jpeg" },
    ]});
    store.addMessage(msg);
    expect(useChatStore.getState().pendingMessages).toHaveLength(0);
  });

  it("markPendingFailed sets status to failed", () => {
    useChatStore.getState().addPendingMessage({ tempId: "tmp-1", text: "Hi", status: "sending" });
    useChatStore.getState().markPendingFailed("tmp-1");
    expect(useChatStore.getState().pendingMessages[0].status).toBe("failed");
  });

  it("prependHistory prepends messages and updates cursor", () => {
    const existing = makeMessage({ id: "msg-2", created_at: "2026-04-01T13:00:00Z" });
    useChatStore.getState().addMessage(existing);

    const older = makeMessage({ id: "msg-1", created_at: "2026-04-01T11:00:00Z" });
    useChatStore.getState().prependHistory([older], "cursor-abc", true);

    const s = useChatStore.getState();
    expect(s.messages[0].id).toBe("msg-1");
    expect(s.messages[1].id).toBe("msg-2");
    expect(s.nextCursor).toBe("cursor-abc");
    expect(s.hasMore).toBe(true);
  });

  it("updateReadReceipt sets read_at on messages up to ID", () => {
    const msg1 = makeMessage({ id: "msg-1", side: "requester" });
    const msg2 = makeMessage({ id: "msg-2", side: "requester" });
    const msg3 = makeMessage({ id: "msg-3", side: "organization" });
    useChatStore.getState().addMessage(msg1);
    useChatStore.getState().addMessage(msg2);
    useChatStore.getState().addMessage(msg3);

    useChatStore.getState().updateReadReceipt("msg-2");
    const msgs = useChatStore.getState().messages;
    expect(msgs[0].read_at).not.toBeNull();
    expect(msgs[1].read_at).not.toBeNull();
    expect(msgs[2].read_at).toBeNull();
  });

  it("reset clears everything", () => {
    const store = useChatStore.getState();
    store.addMessage(makeMessage());
    store.setChatStatus("active");
    store.setConnectionStatus("connected");
    store.setOtherSideTyping(true);
    store.reset();

    const s = useChatStore.getState();
    expect(s.messages).toEqual([]);
    expect(s.chatStatus).toBeNull();
    expect(s.connectionStatus).toBe("disconnected");
    expect(s.otherSideTyping).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/stores/__tests__/chat-store.test.ts 2>&1 | tail -15`
Expected: FAIL — module `../chat-store` not found

- [ ] **Step 3: Implement the chat store**

```typescript
// src/lib/stores/chat-store.ts
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
      // Try to match and remove a pending message (echo matching)
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
    set((state) => ({
      // Items from REST come newest-first; reverse to chronological order and prepend
      messages: [...[...items].reverse(), ...state.messages],
      nextCursor: cursor,
      hasMore,
    })),

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/stores/__tests__/chat-store.test.ts 2>&1 | tail -15`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/chat-store.ts src/lib/stores/__tests__/chat-store.test.ts
git commit -m "feat(chat): add chat Zustand store"
```

---

### Task 4: useChat WebSocket Hook

**Files:**
- Create: `src/lib/hooks/use-chat.ts`
- Test: `src/lib/hooks/__tests__/use-chat.test.ts`

- [ ] **Step 1: Write tests for the useChat hook**

```typescript
// src/lib/hooks/__tests__/use-chat.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useChat } from "../use-chat";
import { useChatStore } from "@/lib/stores/chat-store";

// Mock auth store
vi.mock("@/lib/stores/auth-store", () => ({
  useAuthStore: Object.assign(
    (selector: (s: { token: string }) => string) => selector({ token: "test-token" }),
    { getState: () => ({ token: "test-token", clearAuth: vi.fn() }) }
  ),
}));

// Mock chat API
vi.mock("@/lib/api/chat", () => ({
  chatApi: {
    getMessages: vi.fn().mockResolvedValue({ items: [], next_cursor: null, has_more: false }),
    getStatus: vi.fn().mockResolvedValue({ status: "active", unread_count: 0 }),
    orgGetMessages: vi.fn().mockResolvedValue({ items: [], next_cursor: null, has_more: false }),
    orgGetStatus: vi.fn().mockResolvedValue({ status: "active", unread_count: 0 }),
  },
}));

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
  }

  // Test helpers
  simulateOpen() {
    this.readyState = 1;
    this.onopen?.();
  }

  simulateMessage(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateClose(code = 1000) {
    this.readyState = 3;
    this.onclose?.({ code });
  }
}

beforeEach(() => {
  MockWebSocket.instances = [];
  vi.stubGlobal("WebSocket", MockWebSocket);
  useChatStore.getState().reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useChat", () => {
  it("connects WebSocket on mount", () => {
    renderHook(() => useChat("order-1", "requester"));
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toContain("order-1");
    expect(MockWebSocket.instances[0].url).toContain("token=test-token");
  });

  it("sets connectionStatus to connected on connected frame", async () => {
    renderHook(() => useChat("order-1", "requester"));
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.simulateOpen();
      ws.simulateMessage({ type: "connected", data: { chat_status: "active" } });
    });

    expect(useChatStore.getState().connectionStatus).toBe("connected");
    expect(useChatStore.getState().chatStatus).toBe("active");
  });

  it("adds message to store on message frame", async () => {
    renderHook(() => useChat("order-1", "requester"));
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.simulateOpen();
      ws.simulateMessage({ type: "connected", data: { chat_status: "active" } });
      ws.simulateMessage({
        type: "message",
        data: {
          id: "msg-1",
          side: "organization",
          name: "Org",
          text: "Hello",
          media: [],
          message_type: "user",
          notification_type: null,
          notification_body: null,
          created_at: "2026-04-01T12:00:00Z",
          read_at: null,
        },
      });
    });

    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].text).toBe("Hello");
  });

  it("sendMessage sends frame and adds pending", async () => {
    const { result } = renderHook(() => useChat("order-1", "requester"));
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.simulateOpen();
      ws.simulateMessage({ type: "connected", data: { chat_status: "active" } });
    });

    act(() => {
      result.current.sendMessage("Hi there");
    });

    expect(useChatStore.getState().pendingMessages).toHaveLength(1);
    expect(useChatStore.getState().pendingMessages[0].text).toBe("Hi there");

    const sentFrame = JSON.parse(ws.sent[0]);
    expect(sentFrame.type).toBe("message");
    expect(sentFrame.text).toBe("Hi there");
  });

  it("sets otherSideTyping on typing frame", () => {
    renderHook(() => useChat("order-1", "requester"));
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.simulateOpen();
      ws.simulateMessage({ type: "connected", data: { chat_status: "active" } });
      ws.simulateMessage({ type: "typing", data: { side: "organization", is_typing: true } });
    });

    expect(useChatStore.getState().otherSideTyping).toBe(true);
  });

  it("updates read receipts on read frame", () => {
    // Seed a message first
    useChatStore.getState().addMessage({
      id: "msg-1", side: "requester", name: "Me", text: "Hi",
      media: [], message_type: "user", notification_type: null,
      notification_body: null, created_at: "2026-04-01T12:00:00Z", read_at: null,
    });

    renderHook(() => useChat("order-1", "requester"));
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.simulateOpen();
      ws.simulateMessage({ type: "connected", data: { chat_status: "active" } });
      ws.simulateMessage({ type: "read", data: { side: "organization", until_message_id: "msg-1" } });
    });

    expect(useChatStore.getState().messages[0].read_at).not.toBeNull();
  });

  it("does not reconnect on 4001 close code", async () => {
    vi.useFakeTimers();
    renderHook(() => useChat("order-1", "requester"));
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.simulateOpen();
      ws.simulateMessage({ type: "connected", data: { chat_status: "active" } });
    });

    act(() => {
      ws.simulateClose(4001);
    });

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Should still only have 1 WebSocket instance (no reconnect)
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(useChatStore.getState().connectionStatus).toBe("error");
    vi.useRealTimers();
  });

  it("closes WebSocket on unmount", () => {
    const { unmount } = renderHook(() => useChat("order-1", "requester"));
    const ws = MockWebSocket.instances[0];
    unmount();
    expect(ws.readyState).toBe(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/hooks/__tests__/use-chat.test.ts 2>&1 | tail -15`
Expected: FAIL — module `../use-chat` not found

- [ ] **Step 3: Implement the useChat hook**

```typescript
// src/lib/hooks/use-chat.ts
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
  const apiUrl = process.env.NEXT_PUBLIC_WS_URL
    || process.env.API_URL?.replace(/^https?/, "wss")
    || "wss://api.equip-me.ru/api/v1";
  return `${apiUrl}/orders/${orderId}/chat/ws?token=${token}`;
}

export function useChat(orderId: string, side: ChatSide, orgId?: string) {
  const token = useAuthStore((s) => s.token);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1000);
  const mountedRef = useRef(true);

  const store = useChatStore;

  const send = useCallback((frame: ClientFrame) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(frame));
    }
  }, []);

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
        // REST errors handled by caller or silently ignored on reconnect gap-fill
      }
    },
    [token, orderId, side, orgId, store]
  );

  // Use a ref for connect to avoid circular useCallback dependency
  const connectRef = useRef<() => void>();

  connectRef.current = () => {
    if (!token || !mountedRef.current) return;

    store.getState().setConnectionStatus("connecting");

    const ws = new WebSocket(getWsUrl(orderId, token));
    wsRef.current = ws;

    ws.onopen = () => {
      // Connection established, waiting for "connected" frame
    };

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
              // Mark the most recent sending pending as failed
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

      // Reconnect with exponential backoff
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
          connectRef.current?.();
          // Gap-fill: load latest history after reconnect
          loadHistory();
        }
      }, backoffRef.current);
    };

    ws.onerror = () => {
      // onclose will fire after onerror, reconnection handled there
    };
  };

  // Mount: connect WS + load initial history
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/hooks/__tests__/use-chat.test.ts 2>&1 | tail -20`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/use-chat.ts src/lib/hooks/__tests__/use-chat.test.ts
git commit -m "feat(chat): add useChat WebSocket hook"
```

---

### Task 5: i18n — Chat Translation Keys

**Files:**
- Modify: `src/lib/i18n/messages/en.json`
- Modify: `src/lib/i18n/messages/ru.json`

- [ ] **Step 1: Update English translations**

In `src/lib/i18n/messages/en.json`, replace the `orders.chat` object:

```json
"chat": { "comingSoon": "Chat coming soon", "comingSoonDescription": "You'll be able to message the organization here" }
```

with:

```json
"chat": {
  "title": "Chat",
  "placeholder": "Type a message...",
  "send": "Send",
  "attach": "Attach file",
  "closed": "This conversation is closed",
  "connecting": "Connecting...",
  "reconnecting": "Reconnecting...",
  "connectionError": "Connection failed",
  "noAccess": "You don't have access to this chat",
  "sending": "Sending...",
  "sendFailed": "Failed to send",
  "retry": "Retry",
  "loadMore": "Load earlier messages",
  "today": "Today",
  "yesterday": "Yesterday",
  "typing": "typing...",
  "read": "Read",
  "unreadCount": "{count} unread",
  "slowDown": "Too many messages, slow down",
  "uploadFailed": "Upload failed",
  "uploadTimeout": "Upload timed out",
  "notification": {
    "statusChanged": "Order status: {status}"
  }
}
```

Do the same replacement for `orgOrders.chat`.

- [ ] **Step 2: Update Russian translations**

In `src/lib/i18n/messages/ru.json`, replace the `orders.chat` object:

```json
"chat": { "comingSoon": "Чат скоро появится", "comingSoonDescription": "Здесь вы сможете связаться с организацией" }
```

with:

```json
"chat": {
  "title": "Чат",
  "placeholder": "Напишите сообщение...",
  "send": "Отправить",
  "attach": "Прикрепить файл",
  "closed": "Переписка закрыта",
  "connecting": "Подключение...",
  "reconnecting": "Переподключение...",
  "connectionError": "Ошибка подключения",
  "noAccess": "У вас нет доступа к этому чату",
  "sending": "Отправка...",
  "sendFailed": "Не удалось отправить",
  "retry": "Повторить",
  "loadMore": "Загрузить ранние сообщения",
  "today": "Сегодня",
  "yesterday": "Вчера",
  "typing": "печатает...",
  "read": "Прочитано",
  "unreadCount": "{count} непрочитанных",
  "slowDown": "Слишком много сообщений",
  "uploadFailed": "Ошибка загрузки",
  "uploadTimeout": "Время загрузки истекло",
  "notification": {
    "statusChanged": "Статус заказа: {status}"
  }
}
```

Do the same replacement for `orgOrders.chat`.

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/lib/i18n/messages/en.json','utf8')); console.log('en.json OK')" && node -e "JSON.parse(require('fs').readFileSync('src/lib/i18n/messages/ru.json','utf8')); console.log('ru.json OK')"`
Expected: `en.json OK` and `ru.json OK`

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n/messages/en.json src/lib/i18n/messages/ru.json
git commit -m "feat(chat): add chat i18n keys (en/ru)"
```

---

### Task 6: NotificationBanner Component

**Files:**
- Create: `src/components/chat/notification-banner.tsx`

- [ ] **Step 1: Create the notification banner component**

```typescript
// src/components/chat/notification-banner.tsx
"use client";

import { useTranslations } from "next-intl";
import type { ChatMessage } from "@/types/chat";

interface NotificationBannerProps {
  message: ChatMessage;
  translationPrefix: "orders" | "orgOrders";
}

export function NotificationBanner({ message, translationPrefix }: NotificationBannerProps) {
  const t = useTranslations(translationPrefix);

  if (message.notification_type !== "status_changed" || !message.notification_body) {
    return null;
  }

  const statusLabel = t(`status.${message.notification_body.new_status}`);

  return (
    <div className="flex justify-center py-2">
      <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs text-zinc-500">
        {t("chat.notification.statusChanged", { status: statusLabel })}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `notification-banner.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/notification-banner.tsx
git commit -m "feat(chat): add NotificationBanner component"
```

---

### Task 7: ReadReceipt Component

**Files:**
- Create: `src/components/chat/read-receipt.tsx`

- [ ] **Step 1: Create the read receipt component**

```typescript
// src/components/chat/read-receipt.tsx
"use client";

import { useTranslations } from "next-intl";
import { Check, CheckCheck } from "lucide-react";

interface ReadReceiptProps {
  isRead: boolean;
  translationPrefix: "orders" | "orgOrders";
}

export function ReadReceipt({ isRead, translationPrefix }: ReadReceiptProps) {
  const t = useTranslations(translationPrefix);

  if (isRead) {
    return (
      <span className="inline-flex items-center gap-0.5 text-blue-500" title={t("chat.read")}>
        <CheckCheck className="size-3.5" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-zinc-400">
      <Check className="size-3.5" />
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/read-receipt.tsx
git commit -m "feat(chat): add ReadReceipt component"
```

---

### Task 8: MediaAttachment Component

**Files:**
- Create: `src/components/chat/media-attachment.tsx`

- [ ] **Step 1: Create the media attachment component**

This renders media inside a message bubble — photo thumbnails, video placeholder, document links.

```typescript
// src/components/chat/media-attachment.tsx
"use client";

import { useState } from "react";
import { FileText, Play } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import type { ChatMedia } from "@/types/chat";

interface MediaAttachmentProps {
  media: ChatMedia;
}

export function MediaAttachment({ media }: MediaAttachmentProps) {
  const [open, setOpen] = useState(false);

  if (media.kind === "photo") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="block overflow-hidden rounded-lg">
            <img
              src={media.urls.thumbnail ?? media.urls.large}
              alt={media.original_filename}
              className="max-h-48 max-w-full rounded-lg object-cover"
            />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <img
            src={media.urls.large}
            alt={media.original_filename}
            className="w-full h-auto"
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (media.kind === "video") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="relative flex items-center justify-center rounded-lg bg-zinc-900 size-32">
            <Play className="size-8 text-white" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <video src={media.urls.large} controls className="w-full" />
        </DialogContent>
      </Dialog>
    );
  }

  // Document
  return (
    <a
      href={media.urls.large}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border bg-white/50 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors"
    >
      <FileText className="size-4 text-zinc-500 shrink-0" />
      <span className="truncate">{media.original_filename}</span>
    </a>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/media-attachment.tsx
git commit -m "feat(chat): add MediaAttachment component"
```

---

### Task 9: TypingIndicator Component

**Files:**
- Create: `src/components/chat/typing-indicator.tsx`

- [ ] **Step 1: Create the typing indicator component**

```typescript
// src/components/chat/typing-indicator.tsx
"use client";

import { useTranslations } from "next-intl";

interface TypingIndicatorProps {
  translationPrefix: "orders" | "orgOrders";
}

export function TypingIndicator({ translationPrefix }: TypingIndicatorProps) {
  const t = useTranslations(translationPrefix);

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-zinc-400">
      <span className="flex gap-0.5">
        <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
        <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
        <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
      </span>
      <span>{t("chat.typing")}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/typing-indicator.tsx
git commit -m "feat(chat): add TypingIndicator component"
```

---

### Task 10: MediaPreview Component (Composer)

**Files:**
- Create: `src/components/chat/media-preview.tsx`

- [ ] **Step 1: Create the media preview component**

This renders file upload previews above the chat input with progress and remove functionality.

```typescript
// src/components/chat/media-preview.tsx
"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UploadEntry = {
  tempId: string;
  file: File;
  mediaId: string | null;
  progress: number;
  status: "uploading" | "processing" | "ready" | "failed";
};

interface MediaPreviewProps {
  uploads: UploadEntry[];
  onRemove: (tempId: string) => void;
}

export function MediaPreview({ uploads, onRemove }: MediaPreviewProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="flex gap-2 px-3 pt-2 overflow-x-auto">
      {uploads.map((entry) => (
        <div key={entry.tempId} className="relative shrink-0">
          <div className="size-16 rounded-lg border bg-zinc-50 overflow-hidden flex items-center justify-center">
            {entry.file.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(entry.file)}
                alt={entry.file.name}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-zinc-400 text-center px-1 truncate">
                {entry.file.name}
              </span>
            )}

            {/* Progress overlay */}
            {(entry.status === "uploading" || entry.status === "processing") && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                <svg className="size-8" viewBox="0 0 36 36">
                  <circle
                    className="text-white/30"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    r="15"
                    cx="18"
                    cy="18"
                  />
                  <circle
                    className="text-white"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    r="15"
                    cx="18"
                    cy="18"
                    strokeDasharray={`${entry.progress * 0.94} 94`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
              </div>
            )}

            {/* Failed overlay */}
            {entry.status === "failed" && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-lg">
                <X className="size-5 text-red-600" />
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-zinc-700 text-white hover:bg-zinc-600"
            onClick={() => onRemove(entry.tempId)}
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/media-preview.tsx
git commit -m "feat(chat): add MediaPreview component"
```

---

### Task 11: MessageBubble & PendingBubble Components

**Files:**
- Create: `src/components/chat/message-bubble.tsx`
- Create: `src/components/chat/pending-bubble.tsx`

- [ ] **Step 1: Create the message bubble component**

```typescript
// src/components/chat/message-bubble.tsx
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MediaAttachment } from "./media-attachment";
import { ReadReceipt } from "./read-receipt";
import type { ChatMessage, ChatSide } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  currentSide: ChatSide;
  showReadReceipt: boolean;
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
  translationPrefix,
}: MessageBubbleProps) {
  const isMine = message.side === currentSide;

  return (
    <div className={cn("flex flex-col gap-0.5 max-w-[80%]", isMine ? "self-end items-end" : "self-start items-start")}>
      {!isMine && message.name && (
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
```

- [ ] **Step 2: Create the pending bubble component**

```typescript
// src/components/chat/pending-bubble.tsx
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
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
          <span className="text-[10px] text-zinc-400">{t("chat.sending")}</span>
        )}
        {message.status === "failed" && (
          <span className="flex items-center gap-1">
            <span className="text-[10px] text-red-500">{t("chat.sendFailed")}</span>
            {onRetry && (
              <button
                onClick={() => onRetry(message)}
                className="text-[10px] text-blue-500 hover:underline"
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/message-bubble.tsx src/components/chat/pending-bubble.tsx
git commit -m "feat(chat): add MessageBubble and PendingBubble components"
```

---

### Task 12: MessageList Component

**Files:**
- Create: `src/components/chat/message-list.tsx`

- [ ] **Step 1: Create the message list component**

```typescript
// src/components/chat/message-list.tsx
"use client";

import { useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
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

  // Auto-scroll to bottom on new messages (if user is at bottom)
  useEffect(() => {
    const totalCount = messages.length + pendingMessages.length;
    if (totalCount > prevMessageCountRef.current && isAtBottomRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
    prevMessageCountRef.current = totalCount;
  }, [messages.length, pendingMessages.length]);

  // Mark incoming messages as read when visible
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

    // Track if user is at bottom
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;

    // Load more on scroll to top
    if (el.scrollTop < 50 && hasMore && connectionStatus === "connected") {
      onLoadMore();
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
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            currentSide={currentSide}
            showReadReceipt={i === lastReadIdx}
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/message-list.tsx
git commit -m "feat(chat): add MessageList component"
```

---

### Task 13: ChatHeader Component

**Files:**
- Create: `src/components/chat/chat-header.tsx`

- [ ] **Step 1: Create the chat header component**

```typescript
// src/components/chat/chat-header.tsx
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  translationPrefix: "orders" | "orgOrders";
}

export function ChatHeader({ connectionStatus, translationPrefix }: ChatHeaderProps) {
  const t = useTranslations(translationPrefix);

  return (
    <div className="flex items-center justify-between border-b px-4 py-2.5">
      <h3 className="text-sm font-semibold">{t("chat.title")}</h3>

      {connectionStatus === "connecting" && (
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
          {t("chat.connecting")}
        </span>
      )}

      {connectionStatus === "disconnected" && (
        <span className="flex items-center gap-1.5 text-xs text-yellow-600">
          <span className="size-1.5 rounded-full bg-yellow-500" />
          {t("chat.reconnecting")}
        </span>
      )}

      {connectionStatus === "error" && (
        <span className="flex items-center gap-1.5 text-xs text-red-500">
          <span className="size-1.5 rounded-full bg-red-500" />
          {t("chat.connectionError")}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/chat-header.tsx
git commit -m "feat(chat): add ChatHeader component"
```

---

### Task 14: ChatInput Component

**Files:**
- Create: `src/components/chat/chat-input.tsx`

- [ ] **Step 1: Create the chat input component**

```typescript
// src/components/chat/chat-input.tsx
"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { mediaApi } from "@/lib/api/media";
import { toast } from "sonner";
import { MediaPreview, type UploadEntry } from "./media-preview";
import type { ChatStatus } from "@/types/chat";
import type { MediaKind } from "@/types/media";

interface ChatInputProps {
  chatStatus: ChatStatus | null;
  onSendMessage: (text?: string, mediaIds?: string[]) => void;
  onTyping: (isTyping: boolean) => void;
  translationPrefix: "orders" | "orgOrders";
}

function mediaKindFromMime(mime: string): MediaKind {
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

const POLL_INTERVAL = 500;
const POLL_TIMEOUT = 30_000;

export function ChatInput({
  chatStatus,
  onSendMessage,
  onTyping,
  translationPrefix,
}: ChatInputProps) {
  const t = useTranslations(translationPrefix);
  const token = useAuthStore((s) => s.token);
  const [text, setText] = useState("");
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isReadOnly = chatStatus === "read_only";
  const hasUnfinishedUploads = uploads.some(
    (u) => u.status === "uploading" || u.status === "processing"
  );
  const canSend =
    !isReadOnly &&
    !hasUnfinishedUploads &&
    (text.trim().length > 0 || uploads.some((u) => u.status === "ready"));

  const handleTyping = useCallback(() => {
    onTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => onTyping(false), 3000);
  }, [onTyping]);

  const handleSend = useCallback(() => {
    if (!canSend) return;

    const mediaIds = uploads
      .filter((u) => u.status === "ready" && u.mediaId)
      .map((u) => u.mediaId!);

    const trimmedText = text.trim() || undefined;
    onSendMessage(trimmedText, mediaIds.length > 0 ? mediaIds : undefined);
    setText("");
    setUploads([]);
    onTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [canSend, text, uploads, onSendMessage, onTyping]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    handleTyping();
    // Auto-grow textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const uploadFile = useCallback(
    async (file: File) => {
      if (!token) return;

      const tempId = crypto.randomUUID();
      const entry: UploadEntry = {
        tempId,
        file,
        mediaId: null,
        progress: 0,
        status: "uploading",
      };

      setUploads((prev) => [...prev, entry]);

      try {
        // 1. Request upload URL
        const { media_id, upload_url } = await mediaApi.requestUploadUrl(token, {
          kind: mediaKindFromMime(file.type),
          context: "chat",
          filename: file.name,
          content_type: file.type,
          file_size: file.size,
        });

        // 2. Upload via XHR for progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploads((prev) =>
                prev.map((u) => (u.tempId === tempId ? { ...u, progress: pct } : u))
              );
            }
          });
          xhr.addEventListener("load", () =>
            xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed"))
          );
          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.open("PUT", upload_url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        // 3. Confirm
        await mediaApi.confirm(token, media_id);
        setUploads((prev) =>
          prev.map((u) =>
            u.tempId === tempId ? { ...u, mediaId: media_id, progress: 100, status: "processing" } : u
          )
        );

        // 4. Poll until ready
        const start = Date.now();
        const poll = async () => {
          if (Date.now() - start > POLL_TIMEOUT) {
            setUploads((prev) =>
              prev.map((u) => (u.tempId === tempId ? { ...u, status: "failed" } : u))
            );
            toast.error(t("chat.uploadTimeout"));
            return;
          }
          const res = await mediaApi.status(token, media_id);
          if (res.status === "ready") {
            setUploads((prev) =>
              prev.map((u) => (u.tempId === tempId ? { ...u, status: "ready" } : u))
            );
          } else if (res.status === "failed") {
            setUploads((prev) =>
              prev.map((u) => (u.tempId === tempId ? { ...u, status: "failed" } : u))
            );
            toast.error(t("chat.uploadFailed"));
          } else {
            setTimeout(poll, POLL_INTERVAL);
          }
        };
        poll();
      } catch {
        setUploads((prev) =>
          prev.map((u) => (u.tempId === tempId ? { ...u, status: "failed" } : u))
        );
        toast.error(t("chat.uploadFailed"));
      }
    },
    [token, t]
  );

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(uploadFile);
    e.target.value = "";
  };

  const handleRemoveUpload = (tempId: string) => {
    setUploads((prev) => prev.filter((u) => u.tempId !== tempId));
  };

  if (isReadOnly) {
    return (
      <div className="border-t px-4 py-3 text-center">
        <p className="text-sm text-zinc-400">{t("chat.closed")}</p>
      </div>
    );
  }

  return (
    <div className="border-t">
      <MediaPreview uploads={uploads} onRemove={handleRemoveUpload} />
      <div className="flex items-end gap-2 px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-zinc-400 hover:text-zinc-600"
          onClick={handleFileSelect}
          title={t("chat.attach")}
        >
          <Paperclip className="size-4" />
        </Button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.placeholder")}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-zinc-400 max-h-[120px]"
        />

        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
          onClick={handleSend}
          disabled={!canSend}
          title={t("chat.send")}
        >
          <Send className="size-4" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilesChosen}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/chat-input.tsx
git commit -m "feat(chat): add ChatInput component with media upload"
```

---

### Task 15: ChatPanel Container

**Files:**
- Create: `src/components/chat/chat-panel.tsx`

- [ ] **Step 1: Create the chat panel container**

```typescript
// src/components/chat/chat-panel.tsx
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
    <div className="flex flex-col rounded-lg border bg-white h-[600px] lg:h-full lg:min-h-[400px]">
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/chat-panel.tsx
git commit -m "feat(chat): add ChatPanel container"
```

---

### Task 16: MobileChatButton Component

**Files:**
- Create: `src/components/chat/mobile-chat-button.tsx`

- [ ] **Step 1: Create the mobile chat button with sheet**

```typescript
// src/components/chat/mobile-chat-button.tsx
"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 lg:hidden z-40">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button size="icon" className="size-14 rounded-full shadow-lg relative">
              <MessageCircle className="size-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center size-5 rounded-full bg-red-500 text-[10px] text-white font-medium">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          }
        />
        <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
          <SheetTitle className="sr-only">Chat</SheetTitle>
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/mobile-chat-button.tsx
git commit -m "feat(chat): add MobileChatButton with Sheet"
```

---

### Task 17: Integrate Chat into Order Detail Pages

**Files:**
- Modify: `src/app/[locale]/(public)/orders/[id]/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/org/orders/[id]/page.tsx`

- [ ] **Step 1: Update requester order detail page**

In `src/app/[locale]/(public)/orders/[id]/page.tsx`:

Replace the import:
```typescript
import { ChatPlaceholder } from "@/components/order/chat-placeholder";
```
with:
```typescript
import { ChatPanel } from "@/components/chat/chat-panel";
import { MobileChatButton } from "@/components/chat/mobile-chat-button";
```

Replace the right column JSX:
```tsx
{/* Right column — chat placeholder */}
<div className="w-full lg:w-1/2 shrink-0">
  <ChatPlaceholder translationPrefix="orders" />
</div>
```
with:
```tsx
{/* Right column — chat */}
<div className="hidden lg:block w-full lg:w-1/2 shrink-0">
  <ChatPanel orderId={orderId} side="requester" translationPrefix="orders" />
</div>
```

Add `MobileChatButton` just before the closing `</div>` of the page's outermost container (after the flex row):
```tsx
<MobileChatButton orderId={orderId} side="requester" translationPrefix="orders" />
```

- [ ] **Step 2: Update org order detail page**

In `src/app/[locale]/(dashboard)/org/orders/[id]/page.tsx`:

Replace the import:
```typescript
import { ChatPlaceholder } from "@/components/order/chat-placeholder";
```
with:
```typescript
import { ChatPanel } from "@/components/chat/chat-panel";
import { MobileChatButton } from "@/components/chat/mobile-chat-button";
```

Replace the right column JSX:
```tsx
{/* Right column — chat placeholder */}
<div className="w-full lg:w-1/2 shrink-0">
  <ChatPlaceholder translationPrefix="orgOrders" />
</div>
```
with:
```tsx
{/* Right column — chat */}
<div className="hidden lg:block w-full lg:w-1/2 shrink-0">
  <ChatPanel orderId={orderId} side="organization" orgId={orgId} translationPrefix="orgOrders" />
</div>
```

Add `MobileChatButton` just before the closing `</div>` of the page's outermost container:
```tsx
<MobileChatButton orderId={orderId} side="organization" orgId={orgId} translationPrefix="orgOrders" />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Verify dev server renders without errors**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/(public)/orders/[id]/page.tsx src/app/[locale]/(dashboard)/org/orders/[id]/page.tsx
git commit -m "feat(chat): integrate ChatPanel into order detail pages"
```

---

### Task 18: Unread Count Badge on Order List

**Files:**
- Create: `src/components/order/unread-badge.tsx`
- Modify: `src/components/order/order-table.tsx`

- [ ] **Step 1: Create the unread badge component**

```typescript
// src/components/order/unread-badge.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { chatApi } from "@/lib/api/chat";

interface UnreadBadgeProps {
  orderId: string;
  variant: "renter" | "org" | "org-listing";
}

export function UnreadBadge({ orderId, variant }: UnreadBadgeProps) {
  const token = useAuthStore((s) => s.token);
  const orgId = useOrgStore((s) => s.currentOrg?.id) ?? "";

  const isOrg = variant !== "renter";

  const { data } = useQuery({
    queryKey: ["chat-status", orderId],
    queryFn: () =>
      isOrg
        ? chatApi.orgGetStatus(token!, orgId, orderId)
        : chatApi.getStatus(token!, orderId),
    enabled: !!token && (!isOrg || !!orgId),
    staleTime: 30_000,
  });

  if (!data?.unread_count) return null;

  return (
    <span className="inline-flex items-center justify-center size-5 rounded-full bg-red-500 text-[10px] text-white font-medium">
      {data.unread_count > 99 ? "99+" : data.unread_count}
    </span>
  );
}
```

- [ ] **Step 2: Add unread badge to order table rows**

In `src/components/order/order-table.tsx`, add the import:
```typescript
import { UnreadBadge } from "./unread-badge";
```

In the desktop table, add a new column header after the existing `id` column header:
```tsx
<th className="p-3 text-left font-medium w-10"></th>
```

Add a new cell in each row after the ID cell:
```tsx
<td className="p-3">
  <UnreadBadge orderId={order.id} variant={variant} />
</td>
```

In the mobile cards, add the badge next to the `OrderStatusBadge`:
```tsx
<div className="flex items-center gap-1.5">
  <UnreadBadge orderId={order.id} variant={variant} />
  <OrderStatusBadge status={order.status} />
</div>
```
replacing the existing standalone `<OrderStatusBadge status={order.status} />`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/order/unread-badge.tsx src/components/order/order-table.tsx
git commit -m "feat(chat): add unread count badge to order list"
```

---

### Task 19: Invalidate Chat Status on Page Leave

**Files:**
- Modify: `src/app/[locale]/(public)/orders/[id]/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/org/orders/[id]/page.tsx`

- [ ] **Step 1: Add invalidation on unmount for requester page**

In `src/app/[locale]/(public)/orders/[id]/page.tsx`, add this `useEffect` after the existing query declarations:

```typescript
import { useEffect } from "react";
```

Add inside the component, after the `queryClient` declaration:

```typescript
useEffect(() => {
  return () => {
    queryClient.invalidateQueries({ queryKey: ["chat-status", orderId] });
  };
}, [queryClient, orderId]);
```

- [ ] **Step 2: Add invalidation on unmount for org page**

In `src/app/[locale]/(dashboard)/org/orders/[id]/page.tsx`, add the same pattern:

```typescript
useEffect(() => {
  return () => {
    queryClient.invalidateQueries({ queryKey: ["chat-status", orderId] });
  };
}, [queryClient, orderId]);
```

Note: `useEffect` is already importable from `react` if needed (check existing imports — it may need to be added to the `use` import from React).

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/(public)/orders/[id]/page.tsx src/app/[locale]/(dashboard)/org/orders/[id]/page.tsx
git commit -m "feat(chat): invalidate chat-status on order detail unmount"
```

---

### Task 20: Delete ChatPlaceholder & Run All Tests

**Files:**
- Delete: `src/components/order/chat-placeholder.tsx`

- [ ] **Step 1: Verify ChatPlaceholder is no longer imported anywhere**

Run: `grep -r "ChatPlaceholder\|chat-placeholder" src/ --include="*.tsx" --include="*.ts"`
Expected: No results (all references were replaced in Task 17)

- [ ] **Step 2: Delete the placeholder file**

```bash
rm src/components/order/chat-placeholder.tsx
```

- [ ] **Step 3: Run all tests**

Run: `npx vitest run 2>&1 | tail -30`
Expected: All tests PASS

- [ ] **Step 4: Run full build**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(chat): remove ChatPlaceholder component"
```
