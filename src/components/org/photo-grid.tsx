"use client";

import { useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Upload, X, Loader2 } from "lucide-react";
import { mediaApi } from "@/lib/api/media";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface PhotoItem {
  id: string;
  url: string;
}

interface UploadingItem {
  tempId: string;
  progress: number;
}

interface PhotoGridProps {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  maxPhotos?: number;
}

interface SortablePhotoProps {
  photo: PhotoItem;
  onRemove: () => void;
}

function SortablePhoto({ photo, onRemove }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square rounded-md overflow-hidden border border-border"
    >
      {/* Drag handle covers the image */}
      <div {...attributes} {...listeners} className="w-full h-full cursor-grab active:cursor-grabbing">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 focus:outline-none"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

interface UploadingPhotoProps {
  progress: number;
}

function UploadingPhoto({ progress }: UploadingPhotoProps) {
  return (
    <div className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted flex items-center justify-center">
      <Loader2 className="size-6 text-muted-foreground animate-spin" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/20">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function PhotoGrid({
  photos,
  onChange,
  maxPhotos = 10,
}: PhotoGridProps) {
  const t = useTranslations();
  const { token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadingItem[]>([]);

  // Ref to latest photos so concurrent uploads don't use stale closures
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = photos.findIndex((p) => p.id === active.id);
        const newIndex = photos.findIndex((p) => p.id === over.id);
        onChange(arrayMove(photos, oldIndex, newIndex));
      }
    },
    [photos, onChange]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!token) return;

      const tempId = `uploading-${Date.now()}-${Math.random()}`;
      const localPreviewUrl = URL.createObjectURL(file);

      setUploading((prev) => [...prev, { tempId, progress: 0 }]);

      try {
        // 1. Request presigned URL
        const { media_id, upload_url } = await mediaApi.requestUploadUrl(
          token,
          {
            kind: "photo",
            context: "listing",
            filename: file.name,
            content_type: file.type,
            file_size: file.size,
          }
        );

        // 2. Upload via XHR with progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploading((prev) =>
                prev.map((item) =>
                  item.tempId === tempId ? { ...item, progress: pct } : item
                )
              );
            }
          });
          xhr.addEventListener("load", () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error("Upload failed"))
          );
          xhr.addEventListener("error", () =>
            reject(new Error("Network error"))
          );
          xhr.open("PUT", upload_url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        // 3. Confirm upload
        await mediaApi.confirm(token, media_id);

        // 4. Poll until ready
        while (true) {
          const statusRes = await mediaApi.status(token, media_id);
          if (statusRes.status === "ready") {
            // variants contains relative S3 paths (not signed URLs),
            // so use the local blob preview — real URLs come when listing is fetched after save
            onChangeRef.current([...photosRef.current, { id: media_id, url: localPreviewUrl }]);
            break;
          }
          if (statusRes.status === "failed") {
            toast.error(t("common.error"));
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch {
        toast.error(t("common.error"));
      } finally {
        setUploading((prev) => prev.filter((item) => item.tempId !== tempId));
      }
    },
    [token, t]
  );

  const handleFilesSelected = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const remaining = maxPhotos - photos.length - uploading.length;
      const filesToProcess = Array.from(files).slice(0, remaining);

      for (const file of filesToProcess) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(t("listingForm.photos.invalidType"));
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(t("listingForm.photos.tooLarge"));
          continue;
        }
        uploadFile(file);
      }
    },
    [maxPhotos, photos.length, uploading.length, uploadFile, t]
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(photos.filter((p) => p.id !== id));
    },
    [photos, onChange]
  );

  const isAtMax = photos.length + uploading.length >= maxPhotos;
  const totalShown = photos.length + uploading.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {t("listingForm.photos.title")}
        </span>
        <span className="text-sm text-muted-foreground">
          {t("listingForm.photos.limit", {
            count: totalShown,
            max: maxPhotos,
          })}
        </span>
      </div>

      {/* Photo grid */}
      {(photos.length > 0 || uploading.length > 0) && (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={photos.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photos.map((photo) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  onRemove={() => handleRemove(photo.id)}
                />
              ))}
              {uploading.map((item) => (
                <UploadingPhoto key={item.tempId} progress={item.progress} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload button / drop zone */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
          onClick={(e) => {
            // Reset value so same file can be selected again
            (e.target as HTMLInputElement).value = "";
          }}
        />
        {isAtMax ? (
          <p className="text-sm text-muted-foreground">
            {t("listingForm.photos.maxReached")}
          </p>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4 mr-2" />
            {t("listingForm.photos.upload")}
          </Button>
        )}
      </div>
    </div>
  );
}
