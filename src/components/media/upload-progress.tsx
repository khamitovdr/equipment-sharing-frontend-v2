"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  state: "uploading" | "processing";
  progress: number;
  className?: string;
}

export function UploadProgress({ state, progress, className }: UploadProgressProps) {
  if (state === "processing") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="size-4 animate-spin" />
        <span>Processing...</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-2 rounded-full bg-black transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
