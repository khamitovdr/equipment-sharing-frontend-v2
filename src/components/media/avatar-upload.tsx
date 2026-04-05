"use client";

import { useRef, useEffect } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UploadProgress } from "@/components/media/upload-progress";
import { useMediaUpload } from "@/lib/hooks/use-media-upload";

interface AvatarUploadProps {
  onUploaded: (mediaId: string, url: string) => void;
  currentUrl?: string | null;
}

export function AvatarUpload({ onUploaded, currentUrl }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, progress, media, upload } = useMediaUpload();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await upload(file);
  };

  // Notify parent when upload completes
  useEffect(() => {
    if (state === "ready" && media) {
      const url =
        media.variants["thumbnail"] ||
        media.variants["original"] ||
        Object.values(media.variants)[0] ||
        "";
      if (url) {
        onUploaded(media.id, url);
      }
    }
  }, [state, media, onUploaded]);

  const previewUrl =
    state === "ready" && media
      ? media.variants["thumbnail"] || media.variants["original"] || Object.values(media.variants)[0]
      : currentUrl || undefined;

  const isActive = state === "uploading" || state === "processing";

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
          <UploadProgress state={state as "uploading" | "processing"} progress={progress} />
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
