"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UploadProgress } from "@/components/media/upload-progress";

type UploadState = "idle" | "uploading" | "processing" | "ready" | "failed";

interface AvatarUploadProps {
  /** Called when user selects a file (deferred mode — no upload yet) */
  onFileSelected?: (file: File) => void;
  /** Called after upload completes (immediate mode) */
  onUploaded?: (mediaId: string, url: string) => void;
  /** Current preview URL */
  currentUrl?: string | null;
  /** External upload state (for deferred uploads managed by parent) */
  uploadState?: UploadState;
  /** External upload progress 0-100 */
  uploadProgress?: number;
}

export function AvatarUpload({
  onFileSelected,
  onUploaded,
  currentUrl,
  uploadState = "idle",
  uploadProgress = 0,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);

    // Notify parent
    onFileSelected?.(file);
  };

  const previewUrl = localPreview || currentUrl || undefined;
  const isActive = uploadState === "uploading" || uploadState === "processing";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isActive}
        className="group relative size-20 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
        aria-label="Upload profile photo"
      >
        <Avatar className="size-20">
          <AvatarImage src={previewUrl} alt="Profile photo" />
          <AvatarFallback className="text-2xl">
            <Camera className="size-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        {/* Camera overlay */}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="size-5 text-white" />
        </span>
      </button>

      {isActive && (
        <div className="w-full max-w-[160px]">
          <UploadProgress state={uploadState as "uploading" | "processing"} progress={uploadProgress} />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
