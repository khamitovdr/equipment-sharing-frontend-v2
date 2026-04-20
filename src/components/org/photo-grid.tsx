"use client";

import { useRef, useState, useCallback, useEffect } from "react";
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
import { useApiErrorToast } from "@/lib/hooks/use-api-error-toast";
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

function UploadingPhoto({ progress }: { progress: number }) {
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
  const toastError = useApiErrorToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadingItem[]>([]);

  // Internal source of truth — functional updater ensures concurrent
  // uploads don't lose each other's additions
  const [internalPhotos, setInternalPhotos] = useState<PhotoItem[]>(photos);

  // Notify parent whenever internal state changes
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const prevPhotosRef = useRef(internalPhotos);
  useEffect(() => {
    if (prevPhotosRef.current !== internalPhotos) {
      prevPhotosRef.current = internalPhotos;
      onChangeRef.current(internalPhotos);
    }
  }, [internalPhotos]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setInternalPhotos((prev) => {
          const oldIndex = prev.findIndex((p) => p.id === active.id);
          const newIndex = prev.findIndex((p) => p.id === over.id);
          return arrayMove(prev, oldIndex, newIndex);
        });
      }
    },
    []
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!token) return;

      const tempId = `uploading-${Date.now()}-${Math.random()}`;
      const localPreviewUrl = URL.createObjectURL(file);

      setUploading((prev) => [...prev, { tempId, progress: 0 }]);

      try {
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

        await mediaApi.confirm(token, media_id);

        while (true) {
          const statusRes = await mediaApi.status(token, media_id);
          if (statusRes.status === "ready") {
            // Functional updater — safe for concurrent completions
            setInternalPhotos((prev) => [...prev, { id: media_id, url: localPreviewUrl }]);
            break;
          }
          if (statusRes.status === "failed") {
            toast.error(t("common.error"));
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err) {
        toastError(err);
      } finally {
        setUploading((prev) => prev.filter((item) => item.tempId !== tempId));
      }
    },
    [token, t, toastError]
  );

  const handleFilesSelected = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const remaining = maxPhotos - internalPhotos.length - uploading.length;
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
    [maxPhotos, internalPhotos.length, uploading.length, uploadFile, t]
  );

  const handleRemove = useCallback(
    (id: string) => {
      setInternalPhotos((prev) => prev.filter((p) => p.id !== id));
    },
    []
  );

  const isAtMax = internalPhotos.length + uploading.length >= maxPhotos;
  const totalShown = internalPhotos.length + uploading.length;

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

      {(internalPhotos.length > 0 || uploading.length > 0) && (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={internalPhotos.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {internalPhotos.map((photo) => (
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

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
          onClick={(e) => {
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
