"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { mediaApi } from "@/lib/api/media";
import type { MediaStatusResponse } from "@/types/media";

type UploadState = "idle" | "uploading" | "processing" | "ready" | "failed";

interface UseMediaUploadReturn {
  state: UploadState;
  progress: number;
  media: MediaStatusResponse | null;
  upload: (file: File) => Promise<void>;
  reset: () => void;
}

export function useMediaUpload(): UseMediaUploadReturn {
  const token = useAuthStore((s) => s.token);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [media, setMedia] = useState<MediaStatusResponse | null>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!token) {
        setState("failed");
        return;
      }

      setState("uploading");
      setProgress(0);
      setMedia(null);

      try {
        // 1. Request presigned URL
        const { media_id, upload_url } = await mediaApi.requestUploadUrl(token, {
          kind: "photo",
          context: "user_profile",
          filename: file.name,
          content_type: file.type,
          file_size: file.size,
        });

        // 2. Upload via XHR for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
          xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

          xhr.open("PUT", upload_url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        setProgress(100);

        // 3. Confirm upload
        await mediaApi.confirm(token, media_id);
        setState("processing");

        // 4. Poll for status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await mediaApi.status(token, media_id);
            if (statusResponse.status === "ready") {
              clearInterval(pollInterval);
              setMedia(statusResponse);
              setState("ready");
            } else if (statusResponse.status === "failed") {
              clearInterval(pollInterval);
              setState("failed");
            }
          } catch {
            clearInterval(pollInterval);
            setState("failed");
          }
        }, 2000);
      } catch {
        setState("failed");
      }
    },
    [token]
  );

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setMedia(null);
  }, []);

  return { state, progress, media, upload, reset };
}
