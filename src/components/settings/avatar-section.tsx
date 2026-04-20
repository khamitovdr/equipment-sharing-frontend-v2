"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import { mediaApi } from "@/lib/api/media";
import { usersApi } from "@/lib/api/users";
import { useApiErrorToast } from "@/lib/hooks/use-api-error-toast";
import { AvatarUpload } from "@/components/media/avatar-upload";
import { Card, CardContent } from "@/components/ui/card";

type UploadState = "idle" | "uploading" | "processing" | "ready" | "failed";

export function AvatarSection() {
  const t = useTranslations();
  const { user, token } = useAuthStore();
  const setUser = useAuthStore((s) => s.setUser);
  const toastError = useApiErrorToast();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!token) return;

      try {
        setUploadState("uploading");
        setUploadProgress(0);

        // 1. Get presigned URL
        const { media_id, upload_url } = await mediaApi.requestUploadUrl(
          token,
          {
            kind: "photo",
            context: "user_profile",
            filename: file.name,
            content_type: file.type,
            file_size: file.size,
          }
        );

        // 2. Upload via XHR for progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable)
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
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

        // 3. Confirm
        await mediaApi.confirm(token, media_id);
        setUploadState("processing");

        // 4. Poll until ready
        while (true) {
          const status = await mediaApi.status(token, media_id);
          if (status.status === "ready") {
            // 5. Patch profile with new photo
            const updatedUser = await usersApi.update(token, {
              profile_photo_id: media_id,
            });
            setUser(updatedUser);
            setUploadState("ready");
            toast.success(t("settings.success.profile"));
            return;
          }
          if (status.status === "failed") {
            setUploadState("failed");
            toast.error(t("common.error"));
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err) {
        setUploadState("failed");
        toastError(err);
      }
    },
    [token, setUser, t, toastError]
  );

  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <AvatarUpload
          onFileSelected={handleFileSelected}
          currentUrl={user?.profile_photo?.medium_url}
          uploadState={uploadState}
          uploadProgress={uploadProgress}
        />
        <div>
          <p className="font-medium">
            {user?.name} {user?.surname}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("settings.avatar.change")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
