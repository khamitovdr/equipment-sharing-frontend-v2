"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useInfiniteQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Loader2 } from "lucide-react";

import { organizationsApi } from "@/lib/api/organizations";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrgGuard } from "@/lib/hooks/use-org-guard";
import { MemberTable } from "@/components/org/member-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { MembershipRead } from "@/types/organization";
import type { UserRead } from "@/types/user";

type Tab = "members" | "pending" | "invitations";

const STATUS_FOR_TAB = {
  members: "member",
  pending: "candidate",
  invitations: "invited",
} as const;

export default function MembersPage() {
  const t = useTranslations();
  const locale = useLocale();

  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const orgId = currentOrg?.id ?? "";

  const { hasRole: isAdmin } = useOrgGuard({ minRole: "admin" });
  useOrgGuard(); // ensure at least "viewer"

  const queryClient = useQueryClient();
  void queryClient; // used in MemberTable via prop drilling

  const [activeTab, setActiveTab] = useState<Tab>("members");

  // ── Infinite query for all members ───────────────────────────────
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["members", orgId],
    queryFn: ({ pageParam }) =>
      organizationsApi.listMembers(token!, orgId, {
        cursor: pageParam as string | null | undefined,
        limit: 50,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!token && !!orgId,
  });

  // Flatten all pages
  const allMembers = useMemo<MembershipRead[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  // Filter by tab
  const tabMembers = useMemo(
    () =>
      allMembers.filter(
        (m) => m.status === STATUS_FOR_TAB[activeTab]
      ),
    [allMembers, activeTab]
  );

  // Collect unique user ids
  const uniqueUserIds = useMemo(
    () => [...new Set(allMembers.map((m) => m.user_id))],
    [allMembers]
  );

  // Fetch each user
  const userQueries = useQueries({
    queries: uniqueUserIds.map((userId) => ({
      queryKey: ["user", userId],
      queryFn: () => usersApi.getById(userId),
      staleTime: 300_000,
    })),
  });

  // Build Record<userId, UserRead>
  const users = useMemo<Record<string, UserRead>>(() => {
    const map: Record<string, UserRead> = {};
    uniqueUserIds.forEach((id, i) => {
      const result = userQueries[i]?.data;
      if (result) map[id] = result;
    });
    return map;
  }, [uniqueUserIds, userQueries]);

  // Tab config
  const tabs: { key: Tab; label: string }[] = [
    { key: "members", label: t("members.tabs.members") },
    { key: "pending", label: t("members.tabs.pending") },
    { key: "invitations", label: t("members.tabs.invitations") },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("members.title")}
        </h1>
        {isAdmin && (
          <Link href={`/${locale}/org/members/invite`} className={cn(buttonVariants(), "gap-2")}>
            <UserPlus className="size-4" />
            {t("invite.title")}
          </Link>
        )}
      </div>

      {/* Tab group */}
      <div className="flex items-center gap-1 rounded-lg bg-muted/50 border p-1 w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-muted text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonRows />
      ) : (
        <>
          {tabMembers.length === 0 ? (
            <EmptyState
              message={t(`members.empty.${activeTab}`)}
              ctaLabel={
                activeTab === "invitations" && isAdmin
                  ? t("invite.title")
                  : undefined
              }
              onCtaClick={
                activeTab === "invitations" && isAdmin
                  ? () => {
                      window.location.href = `/${locale}/org/members/invite`;
                    }
                  : undefined
              }
            />
          ) : (
            <MemberTable
              members={tabMembers}
              users={users}
              tab={activeTab}
              isAdmin={isAdmin}
              currentUserId={currentUser?.id ?? ""}
              orgId={orgId}
            />
          )}

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                )}
                {t("common.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
          <Skeleton className="size-8 rounded-full shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-40 hidden sm:block" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="size-8 rounded" />
        </div>
      ))}
    </div>
  );
}
