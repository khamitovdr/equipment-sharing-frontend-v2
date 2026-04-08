"use client";

import { useTranslations } from "next-intl";
import { ChevronsUpDown } from "lucide-react";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrg } from "@/lib/hooks/use-org";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function OrgSwitcher() {
  const t = useTranslations("dashboard.sidebar");
  const { organizations, currentOrg } = useOrgStore();
  const { switchOrg } = useOrg();

  if (organizations.length <= 1) return null;

  return (
    <div className="border-t border-zinc-200 p-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="truncate">{t("switchOrg")}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-zinc-400" />
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
