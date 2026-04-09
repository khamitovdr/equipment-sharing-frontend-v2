"use client";

import { useState } from "react";
import { Play, Download } from "lucide-react";
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
        <DialogTrigger
          render={
            <button className="block overflow-hidden rounded-lg cursor-pointer" />
          }
        >
          <img
            src={media.urls.thumbnail ?? media.urls.large}
            alt={media.original_filename}
            className="max-h-48 max-w-full rounded-lg object-cover"
          />
        </DialogTrigger>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <img
            src={media.urls.large}
            alt={media.original_filename}
            className="w-full h-auto"
          />
          <a
            href={media.urls.large}
            download={media.original_filename}
            className="absolute top-2 right-10 flex items-center justify-center size-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <Download className="size-4" />
          </a>
        </DialogContent>
      </Dialog>
    );
  }

  if (media.kind === "video") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <button className="relative flex items-center justify-center rounded-lg bg-foreground size-32 cursor-pointer" />
          }
        >
          <Play className="size-8 text-white" />
        </DialogTrigger>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <video src={media.urls.large} controls className="w-full" />
          <a
            href={media.urls.large}
            download={media.original_filename}
            className="absolute top-2 right-10 flex items-center justify-center size-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <Download className="size-4" />
          </a>
        </DialogContent>
      </Dialog>
    );
  }

  // Document — direct download (same-origin)
  return (
    <a
      href={media.urls.large}
      download={media.original_filename}
      className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <Download className="size-4 text-muted-foreground shrink-0" />
      <span className="truncate">{media.original_filename}</span>
    </a>
  );
}
