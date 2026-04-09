"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { ordersApi } from "@/lib/api/orders";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";

export default function OrgIndexPage() {
  const locale = useLocale();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const orgId = useOrgStore((s) => s.currentOrg?.id) ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["org-orders-check", orgId],
    queryFn: () => ordersApi.orgList(token!, orgId, { limit: 1 }),
    enabled: !!token && !!orgId,
  });

  useEffect(() => {
    if (isLoading || !data) return;

    if (data.items.length > 0) {
      router.replace(`/${locale}/org/orders`);
    } else {
      router.replace(`/${locale}/org/listings`);
    }
  }, [data, isLoading, locale, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
