"use client";

import { useMemo } from "react";
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
        <PreviewItem key={entry.tempId} entry={entry} onRemove={onRemove} />
      ))}
    </div>
  );
}

function PreviewItem({ entry, onRemove }: { entry: UploadEntry; onRemove: (id: string) => void }) {
  const objectUrl = useMemo(
    () => (entry.file.type.startsWith("image/") ? URL.createObjectURL(entry.file) : null),
    [entry.file]
  );

  return (
        <div className="relative shrink-0">
          <div className="size-16 rounded-lg border bg-zinc-50 overflow-hidden flex items-center justify-center">
            {objectUrl ? (
              <img
                src={objectUrl}
                alt={entry.file.name}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-zinc-400 text-center px-1 truncate">
                {entry.file.name}
              </span>
            )}

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
  );
}
