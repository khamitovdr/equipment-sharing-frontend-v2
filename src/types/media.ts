export type MediaKind = "photo" | "video" | "document";
export type MediaContext = "user_profile" | "org_profile" | "listing" | "chat";
export type MediaStatus = "pending_upload" | "processing" | "ready" | "failed";

export interface UploadUrlRequest {
  kind: MediaKind;
  context: MediaContext;
  filename: string;
  content_type: string;
  file_size: number;
}

export interface UploadUrlResponse {
  media_id: string;
  upload_url: string;
  expires_in: number;
}

export interface MediaStatusResponse {
  id: string;
  status: MediaStatus;
  kind: MediaKind;
  context: MediaContext;
  original_filename: string;
  variants: Record<string, string>;
}
