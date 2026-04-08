"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrg } from "@/lib/hooks/use-org";
import { OrgSidebar } from "@/components/layout/org-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { membership, organizations } = useOrgStore();
  const { fetchOrganizations, fetchCurrentOrg } = useOrg();

  const [hydrated, setHydrated] = useState(false);
  const [orgReady, setOrgReady] = useState(false);

  // Step 1: mark client hydration complete
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Step 2: auth guard
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace(`/${locale}/login`);
    }
  }, [hydrated, isAuthenticated, locale, router]);

  // Step 3: org context guard
  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;

    async function initOrg() {
      const memberships = await fetchOrganizations();
      if (!memberships || memberships.length === 0) {
        router.replace(`/${locale}/organizations/new`);
        return;
      }

      // Use already-selected org or fall back to first
      const currentOrgId = membership?.organization_id ?? memberships[0].organization_id;
      await fetchCurrentOrg(currentOrgId);
      setOrgReady(true);
    }

    initOrg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated]);

  if (!hydrated || !isAuthenticated) return null;

  if (!orgReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <OrgSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
