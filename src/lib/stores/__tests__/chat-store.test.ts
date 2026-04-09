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

  it("addMessage skips duplicate message IDs", () => {
    const msg = makeMessage({ id: "msg-1" });
    useChatStore.getState().addMessage(msg);
    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().messages).toHaveLength(1);
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
