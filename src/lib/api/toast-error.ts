import { toast } from "sonner";
import { ApiRequestError } from "./client";

export interface ToastApiErrorLabels {
  traceIdLabel: string;
  copyTraceId: string;
  traceIdCopied: string;
}

export function toastApiError(
  err: unknown,
  fallback: string,
  labels?: ToastApiErrorLabels
): void {
  if (!(err instanceof ApiRequestError)) {
    toast.error(fallback);
    return;
  }

  const title = typeof err.detail === "string" ? err.detail : fallback;

  if (!err.traceId || !labels) {
    toast.error(title);
    return;
  }

  const fullTraceId = err.traceId;
  const shortTraceId = fullTraceId.slice(0, 8);

  toast.error(title, {
    description: `${labels.traceIdLabel}: ${shortTraceId}…`,
    action: {
      label: labels.copyTraceId,
      onClick: () => {
        void (async () => {
          try {
            await navigator.clipboard.writeText(fullTraceId);
            toast.success(labels.traceIdCopied);
          } catch {
            // clipboard unavailable — silent
          }
        })();
      },
    },
  });
}
