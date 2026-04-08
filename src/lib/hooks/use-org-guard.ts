"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useOrgStore } from "@/lib/stores/org-store";
import type { MembershipRole } from "@/types/organization";

const ROLE_HIERARCHY: Record<MembershipRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
};

interface UseOrgGuardOptions {
  minRole?: MembershipRole;
}

interface UseOrgGuardResult {
  hasRole: boolean;
  role: MembershipRole | null;
}

export function useOrgGuard(
  { minRole = "viewer" }: UseOrgGuardOptions = {}
): UseOrgGuardResult {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("OrgGuard");
  const membership = useOrgStore((s) => s.membership);

  const role = membership?.role ?? null;
  const hasRole =
    role !== null && ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];

  useEffect(() => {
    if (role !== null && !hasRole) {
      toast.error(t("insufficientPermissions"));
      router.push(`/${locale}/org/listings`);
    }
  }, [role, hasRole, locale, router, t]);

  return { hasRole, role };
}
