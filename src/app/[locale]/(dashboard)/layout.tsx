"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrg } from "@/lib/hooks/use-org";
import { OrgSidebar } from "@/components/layout/org-sidebar";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const { fetchOrganizations, fetchCurrentOrg, fetchCurrentRole } = useOrg();

  const [hydrated, setHydrated] = useState(false);
  const [orgReady, setOrgReady] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace(`/${locale}/login`);
    }
  }, [hydrated, isAuthenticated, locale, router]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;

    async function initOrg() {
      const orgs = await fetchOrganizations();
      if (!orgs || orgs.length === 0) {
        router.replace(`/${locale}/organizations/new`);
        return;
      }

      // Use already-selected org or fall back to first
      const orgId = currentOrg?.id ?? orgs[0].id;
      await Promise.all([
        fetchCurrentOrg(orgId),
        fetchCurrentRole(orgId),
      ]);
      setOrgReady(true);
    }

    initOrg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated]);

  if (!hydrated || !isAuthenticated) return null;

  if (!orgReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <OrgSidebar />
      <main className="flex-1 flex flex-col overflow-auto pt-14 lg:pt-0">{children}</main>
      <ScrollToTop />
    </div>
  );
}
