import { toast } from "sonner";
import { ApiRequestError } from "./client";

export function toastApiError(err: unknown, fallback: string): void {
  if (!(err instanceof ApiRequestError)) {
    toast.error(fallback);
    return;
  }

  const title = typeof err.detail === "string" ? err.detail : fallback;

  if (!err.traceId) {
    toast.error(title);
    return;
  }

  const fullTraceId = err.traceId;
  const shortTraceId = fullTraceId.slice(0, 8);

  toast.error(title, {
    description: `ID: ${shortTraceId}…`,
    action: {
      label: "Copy",
      onClick: () => {
        void navigator.clipboard.writeText(fullTraceId).then(() => {
          toast.success("Trace ID copied");
        });
      },
    },
  });
}
