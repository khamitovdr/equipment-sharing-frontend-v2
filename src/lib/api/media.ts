import { apiClient } from "./client";
import type { UploadUrlRequest, UploadUrlResponse, MediaStatusResponse } from "@/types/media";

export const mediaApi = {
  requestUploadUrl(token: string, data: UploadUrlRequest) {
    return apiClient<UploadUrlResponse>("/media/upload-url", {
      method: "POST",
      body: data,
      token,
    });
  },

  confirm(token: string, mediaId: string) {
    return apiClient<MediaStatusResponse>(`/media/${mediaId}/confirm`, {
      method: "POST",
      token,
    });
  },

  status(token: string, mediaId: string) {
    return apiClient<MediaStatusResponse>(`/media/${mediaId}/status`, {
      token,
    });
  },
};
