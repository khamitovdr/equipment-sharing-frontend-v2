"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { chatApi } from "@/lib/api/chat";

interface UnreadBadgeProps {
  orderId: string;
  variant: "renter" | "org" | "org-listing";
}

export function UnreadBadge({ orderId, variant }: UnreadBadgeProps) {
  const token = useAuthStore((s) => s.token);
  const orgId = useOrgStore((s) => s.currentOrg?.id) ?? "";

  const isOrg = variant !== "renter";

  const { data } = useQuery({
    queryKey: ["chat-status", orderId],
    queryFn: () =>
      isOrg
        ? chatApi.orgGetStatus(token!, orgId, orderId)
        : chatApi.getStatus(token!, orderId),
    enabled: !!token && (!isOrg || !!orgId),
    staleTime: 30_000,
  });

  if (!data?.unread_count) return null;

  return (
    <span className="inline-flex items-center justify-center size-5 rounded-full bg-red-500 text-[10px] text-white font-medium">
      {data.unread_count > 99 ? "99+" : data.unread_count}
    </span>
  );
}
