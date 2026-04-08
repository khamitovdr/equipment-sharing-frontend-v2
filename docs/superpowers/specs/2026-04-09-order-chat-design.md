# Order Chat Design

Order-scoped real-time chat between requester and organization. Replaces the `ChatPlaceholder` component with a full messaging interface supporting text, media attachments, typing indicators, read receipts, and order status notifications.

Backend contract: `docs/chat-integration-guide.md`

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Layout (desktop) | Replace `ChatPlaceholder` in existing right column | Layout already in target state |
| Layout (mobile) | Sticky bottom button → full-screen `Sheet` | Clean separation from order info |
| WebSocket lifecycle | Connect on mount, close on unmount | Simple, always-on for the active page |
| Message rendering | Optimistic UI with temp ID correlation | Instant feel for the sender |
| Media upload | Start immediately on file selection | Parallel upload while user types caption |
| Reconnection | Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s cap | Resilient without hammering the server |
| Unread count | Per-row `useQuery` on orders list page only | Simple, TanStack Query deduplicates |
| Notifications | Purely visual, no sound/vibration | User preference |
| Architecture | Zustand store + raw WebSocket + TanStack Query for REST | Matches existing project patterns, no new dependencies |

---

## Scope

All features from the chat integration guide:

- Text messaging (send/receive via WebSocket)
- Message history (paginated REST, cursor-based, newest first)
- Media attachments (photo, video, document — 4-step upload flow)
- Typing indicators (send and receive)
- Read receipts (send and receive, double-check UI)
- Order status notifications (system-generated banners)
- Read-only mode (disable input when chat is closed)
- Unread count badge on orders list pages
- Reconnection with exponential backoff
- i18n (Russian and English)

---

## Types

New file: `src/types/chat.ts`

### WebSocket frames

```typescript
// Client → Server
type ClientFrame =
  | { type: "message"; text?: string; media_ids?: string[] }
  | { type: "typing"; is_typing: boolean }
  | { type: "read"; until_message_id: string }

// Server → Client
type ServerFrame =
  | { type: "connected"; data: { chat_status: ChatStatus } }
  | { type: "message"; data: ChatMessage }
  | { type: "notification"; data: ChatMessage }
  | { type: "typing"; data: { side: ChatSide; is_typing: boolean } }
  | { type: "read"; data: { side: ChatSide; until_message_id: string } }
  | { type: "error"; data: { code: string; detail: string } }
```

### Domain types

```typescript
type ChatStatus = "active" | "read_only"
type ChatSide = "requester" | "organization"
type MessageType = "user" | "notification"
type NotificationType = "status_changed"
type MediaKind = "photo" | "video" | "document"

interface ChatMessage {
  id: string
  side: ChatSide
  name: string | null
  text: string | null
  media: ChatMedia[]
  message_type: MessageType
  notification_type: NotificationType | null
  notification_body: { old_status: string; new_status: string } | null
  created_at: string
  read_at: string | null
}

interface ChatMedia {
  id: string
  kind: MediaKind
  urls: { thumbnail?: string; large: string }
  original_filename: string
  content_type: string
}

interface PendingMessage {
  tempId: string
  text?: string
  media_ids?: string[]
  status: "sending" | "failed"
}
```

### REST responses

```typescript
interface ChatMessagesResponse {
  items: ChatMessage[]
  next_cursor: string | null
  has_more: boolean
}

interface ChatStatusResponse {
  status: ChatStatus
  unread_count: number
}
```

---

## State Management

New file: `src/lib/stores/chat-store.ts`

Zustand store, **not persisted**. Scoped to the currently viewed order chat, reset on unmount.

### State

```
messages: ChatMessage[]              — server-confirmed, chronological order (oldest first)
pendingMessages: PendingMessage[]    — optimistic, awaiting server echo
chatStatus: ChatStatus | null        — from "connected" frame
connectionStatus: "connecting" | "connected" | "disconnected" | "error"
otherSideTyping: boolean
hasMore: boolean
nextCursor: string | null
```

### Actions

```
addMessage(msg)                          — append confirmed message, remove matching pending
addPendingMessage(pending)               — append optimistic message
markPendingFailed(tempId)                — set pending status to "failed"
prependHistory(items, cursor, hasMore)   — prepend older messages from REST
updateReadReceipt(untilMessageId)        — set read_at on messages up to and including ID
setOtherSideTyping(value)
setChatStatus(status)
setConnectionStatus(status)
reset()                                  — clear all state
```

### Echo matching

The server doesn't return a client-generated temp ID. Match the echo to a pending message by comparing `text` + `media_ids` (set equality). Remove the first matching pending message.

---

## WebSocket Hook

New file: `src/lib/hooks/use-chat.ts`

```
useChat(orderId: string, side: ChatSide, orgId?: string)
```

### Inputs

- `orderId` — from route params
- `side` — `"requester"` or `"organization"` (determines REST endpoint prefix)
- `orgId` — required when `side === "organization"` (from org store), used for org REST endpoints

### Returns

```
sendMessage(text?, mediaIds?)   — optimistic add + WS frame
sendTyping(isTyping)            — WS typing frame
markAsRead(untilMessageId)      — WS read frame
loadMoreHistory()               — REST fetch, prepend to store
chatStatus                      — from store
connectionStatus                — from store
```

### Lifecycle

1. On mount: connect WebSocket, load initial history page via REST
2. On `"connected"` frame: store `chat_status`
3. On `"message"` / `"notification"` frame: `store.addMessage()`
4. On `"typing"` frame: `store.setOtherSideTyping()`
5. On `"read"` frame: `store.updateReadReceipt()`
6. On `"error"` frame: handle by error code (see Error Handling)
7. On close: reconnect with exponential backoff unless permanent error
8. On unmount: close WebSocket, cancel reconnect timer, `store.reset()`

### WebSocket URL

Connects directly to the backend (Next.js API proxy doesn't support WebSocket):

```
wss://api.equip-me.ru/api/v1/orders/{orderId}/chat/ws?token={jwt}
```

Construct by replacing `https://` with `wss://` in the `API_URL` env var.

### Reconnection

```
Delays: 1s → 2s → 4s → 8s → 16s → 30s (capped)
Reset to 1s on successful "connected" frame
Skip reconnect on close codes: 4001, 4003, 4004
On reconnect success: fetch latest history page via REST to fill gap
```

---

## API Layer

New file: `src/lib/api/chat.ts`

Follows the same pattern as `src/lib/api/orders.ts`.

### Chat endpoints

```
chatApi.getMessages(token, orderId, params?)           — GET /orders/{orderId}/chat/messages
chatApi.getStatus(token, orderId)                      — GET /orders/{orderId}/chat/status
chatApi.orgGetMessages(token, orgId, orderId, params?) — GET /organizations/{orgId}/orders/{orderId}/chat/messages
chatApi.orgGetStatus(token, orgId, orderId)            — GET /organizations/{orgId}/orders/{orderId}/chat/status
```

### Media upload

```
uploadMedia(token, file: File, onProgress?: (pct: number) => void) → Promise<string>
```

Steps:
1. `POST /media/upload-url` — get `media_id` + `upload_url`
2. `PUT upload_url` — upload binary via `XMLHttpRequest` (for `upload.onprogress`)
3. `POST /media/{media_id}/confirm`
4. `GET /media/{media_id}/status` — poll every 500ms, timeout 30s

Returns `media_id` when status is `"ready"`. Throws on failure or timeout.

`kind` derived from MIME: `image/* → "photo"`, `video/* → "video"`, else `"document"`.

---

## Components

### Component tree

```
ChatPanel (container — replaces ChatPlaceholder)
├── ChatHeader (connection status indicator)
├── MessageList (scrollable, loads history on scroll-up)
│   ├── MessageBubble (text + media, left/right by side)
│   │   ├── MediaAttachment (photo thumbnail, video, document link)
│   │   └── ReadReceipt (check marks)
│   ├── PendingBubble (optimistic message with "sending..." state)
│   └── NotificationBanner (status change, centered)
├── TypingIndicator (animated dots when other side is typing)
└── ChatInput (textarea + send button + attach button)
    └── MediaPreview (selected files with upload progress, removable)

MobileChatButton (sticky bottom button, visible on sm breakpoint only)
```

All components in `src/components/chat/`.

### ChatPanel

- Props: `orderId`, `side`
- Calls `useChat(orderId, side)`
- Reads messages/pending/typing from chat store
- Desktop: renders inline in existing right column
- Mobile: wrapped in shadcn `Sheet`, triggered by `MobileChatButton`

### MessageList

- Scrolls to bottom on new messages (unless user has scrolled up)
- On scroll to top: calls `loadMoreHistory()` if `hasMore`
- Shows `Skeleton` while fetching history

### MessageBubble

- Other side: left-aligned, `bg-zinc-100`, sender name above
- Current user: right-aligned, `bg-zinc-900 text-white`
- Timestamp below the bubble
- Read receipt (double check) shown only on the last consecutive message from current user that has been read

### NotificationBanner

- Centered text on `bg-zinc-100` with subtle border
- Maps `notification_body.new_status` to translated status label (reuses existing `orders.status.*` keys)
- No avatar, no side alignment

### TypingIndicator

- Animated three-dot indicator below message list
- Shows when `otherSideTyping` is true
- Auto-hides (the server/other client sends `is_typing: false`)

### ChatInput

- Disabled with "Conversation is closed" notice when `chatStatus === "read_only"`
- Auto-growing `textarea` (max ~4 lines, then scrolls)
- Enter to send, Shift+Enter for newline
- Attach button → file picker → immediate `uploadMedia()` call
- Send button disabled while any upload is not `"ready"`

### MediaPreview (in composer)

- Thumbnail with circular progress indicator
- Remove (X) button to cancel before sending
- States: `uploading` → `processing` → `ready` / `failed`

### MediaAttachment (in bubble)

- Photo: clickable thumbnail → large image in `Dialog`
- Video: thumbnail with play icon → video player in `Dialog`
- Document: file icon + filename, clickable to download (`large` URL)

### MobileChatButton

- Fixed bottom-right, visible only below `lg` breakpoint
- `MessageCircle` icon with unread count badge
- Opens `Sheet` containing `ChatPanel`

---

## Unread Count on Orders List

Per-row `useQuery` keyed by `["chat-status", orderId]`:

- Each order row in `OrderTable` fetches its own chat status
- TanStack Query deduplicates and caches (30s stale time)
- Badge renders inline — small red circle with count, or nothing if 0
- On leaving order detail page: invalidate `["chat-status", orderId]` to refresh the count

Applies to both requester (`/orders`) and org (`/org/orders`) list pages.

---

## Error Handling

### WebSocket close codes

| Code | Action |
|---|---|
| 4001 (auth failed) | Clear auth store, redirect to login |
| 4003 (not participant) | Toast "No access", set `connectionStatus` to `"error"`, no reconnect |
| 4004 (order not found) | Toast "Order not found", no reconnect |
| Other / network | Reconnect with exponential backoff |

### WebSocket error frames

| Code | Action |
|---|---|
| `rate_limited` | `toast.error()` with throttle message |
| `read_only` | Set `chatStatus` to `"read_only"`, disable input |
| `validation_error` | `toast.error()` with detail, mark pending message as failed |
| `invalid_json` | `console.error()` only (client bug) |

### REST errors

Handled by existing TanStack Query retry (1 attempt) and error states.

### Media errors

- Upload failure → mark as `"failed"` in composer, show retry option
- Poll timeout (30s) → mark as `"failed"`, toast "Upload timed out"

### Connection status UI (ChatHeader)

- `"connected"` — no indicator
- `"connecting"` — subtle pulsing dot / "Connecting..." text
- `"disconnected"` — yellow bar "Reconnecting..."
- `"error"` — red bar for permanent failures

---

## i18n

New keys under `orders.chat` and `orgOrders.chat` in both `en.json` and `ru.json`:

```
chat.title                          — "Chat" / "Чат"
chat.placeholder                    — "Type a message..." / "Напишите сообщение..."
chat.send                           — "Send" / "Отправить"
chat.attach                         — "Attach file" / "Прикрепить файл"
chat.closed                         — "This conversation is closed" / "Переписка закрыта"
chat.connecting                     — "Connecting..." / "Подключение..."
chat.reconnecting                   — "Reconnecting..." / "Переподключение..."
chat.connectionError                — "Connection failed" / "Ошибка подключения"
chat.noAccess                       — "You don't have access" / "У вас нет доступа к этому чату"
chat.sending                        — "Sending..." / "Отправка..."
chat.sendFailed                     — "Failed to send" / "Не удалось отправить"
chat.retry                          — "Retry" / "Повторить"
chat.loadMore                       — "Load earlier messages" / "Загрузить ранние сообщения"
chat.today                          — "Today" / "Сегодня"
chat.yesterday                      — "Yesterday" / "Вчера"
chat.typing                         — "typing..." / "печатает..."
chat.read                           — "Read" / "Прочитано"
chat.unreadCount                    — "{count} unread" / "{count} непрочитанных"
chat.slowDown                       — "Too many messages, slow down" / "Слишком много сообщений"
chat.uploadFailed                   — "Upload failed" / "Ошибка загрузки"
chat.uploadTimeout                  — "Upload timed out" / "Время загрузки истекло"
chat.notification.statusChanged     — "Order status: {status}" / "Статус заказа: {status}"
```

Status labels for notifications reuse existing `orders.status.*` keys.

---

## File Map

```
src/
├── types/chat.ts                          — all chat types
├── lib/
│   ├── api/chat.ts                        — REST endpoints + uploadMedia
│   ├── stores/chat-store.ts               — Zustand chat store
│   └── hooks/use-chat.ts                  — WebSocket hook
├── components/chat/
│   ├── chat-panel.tsx                     — container component
│   ├── chat-header.tsx                    — connection status
│   ├── message-list.tsx                   — scrollable message list
│   ├── message-bubble.tsx                 — single message
│   ├── media-attachment.tsx               — media in bubble
│   ├── read-receipt.tsx                   — check marks
│   ├── pending-bubble.tsx                 — optimistic message
│   ├── notification-banner.tsx            — status change banner
│   ├── typing-indicator.tsx               — animated dots
│   ├── chat-input.tsx                     — composer
│   ├── media-preview.tsx                  — upload preview in composer
│   └── mobile-chat-button.tsx             — sticky trigger for mobile sheet
├── lib/i18n/messages/en.json              — new chat.* keys
└── lib/i18n/messages/ru.json              — new chat.* keys

Modified:
├── app/[locale]/(public)/orders/[id]/page.tsx         — replace ChatPlaceholder with ChatPanel
├── app/[locale]/(dashboard)/org/orders/[id]/page.tsx  — replace ChatPlaceholder with ChatPanel
├── components/order/order-table.tsx                    — add unread count badge per row
```
