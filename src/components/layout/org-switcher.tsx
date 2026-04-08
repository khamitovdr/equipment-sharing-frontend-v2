"use client";

import { useTranslations } from "next-intl";
import { ChevronsUpDown } from "lucide-react";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrgGuard } from "@/lib/hooks/use-org-guard";
import { useOrg } from "@/lib/hooks/use-org";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { OrgPlaceholder } from "@/components/shared/org-placeholder";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function OrgSwitcher() {
  const t = useTranslations();
  const { organizations, currentOrg } = useOrgStore();
  const { switchOrg } = useOrg();
  const { role } = useOrgGuard();

  const orgName = currentOrg?.short_name ?? currentOrg?.full_name ?? "…";
  const initials = orgName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");

  const roleLabelMap: Record<string, string> = {
    admin: t("members.role.admin"),
    editor: t("members.role.editor"),
    viewer: t("members.role.viewer"),
  };
  const roleLabel = role ? (roleLabelMap[role] ?? role) : null;

  const hasMultipleOrgs = organizations.length > 1;

  const content = (
    <div className="flex w-full items-center gap-3">
      {currentOrg?.photo?.medium_url ? (
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={currentOrg.photo.medium_url} alt={orgName} />
        </Avatar>
      ) : (
        <OrgPlaceholder className="size-8 shrink-0" />
      )}
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-zinc-900">{orgName}</p>
        {roleLabel && (
          <p className="text-xs text-zinc-500">{roleLabel}</p>
        )}
      </div>
      {hasMultipleOrgs && (
        <ChevronsUpDown className="size-4 shrink-0 text-zinc-400" />
      )}
    </div>
  );

  if (!hasMultipleOrgs) {
    return (
      <div className="border-t border-zinc-200 p-3">
        <div className="rounded-md px-2 py-1.5">{content}</div>
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-200 p-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full rounded-md px-2 py-1.5 hover:bg-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
          {content}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-52">
          {organizations.map((org) => {
            const isActive = org.id === currentOrg?.id;
            return (
              <DropdownMenuItem
                key={org.id}
                className={isActive ? "bg-zinc-100" : undefined}
                onClick={() => switchOrg(org.id)}
              >
                {org.short_name || org.full_name || org.inn}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
