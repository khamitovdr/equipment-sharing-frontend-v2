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
        const { media_id, upload_url } = await mediaApi.requestUploadUrl(token, {
          kind: mediaKindFromMime(file.type),
          context: "chat",
          filename: file.name,
          content_type: file.type,
          file_size: file.size,
        });

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

        await mediaApi.confirm(token, media_id);
        setUploads((prev) =>
          prev.map((u) =>
            u.tempId === tempId ? { ...u, mediaId: media_id, progress: 100, status: "processing" } : u
          )
        );

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
        <p className="text-sm text-muted-foreground">{t("chat.closed")}</p>
      </div>
    );
  }

  return (
    <div className="border-t">
      <MediaPreview uploads={uploads} onRemove={handleRemoveUpload} />
      <div className="flex items-center gap-2 px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
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
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground max-h-[120px]"
        />

        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
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
