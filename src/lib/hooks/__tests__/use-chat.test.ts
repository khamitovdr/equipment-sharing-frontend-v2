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
          id: "msg-1", side: "organization", name: "Org", text: "Hello",
          media: [], message_type: "user", notification_type: null,
          notification_body: null, created_at: "2026-04-01T12:00:00Z", read_at: null,
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
