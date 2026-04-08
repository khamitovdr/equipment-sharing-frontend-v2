"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LayoutGrid, Users, Settings, Menu } from "lucide-react";
import { useState } from "react";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrgGuard } from "@/lib/hooks/use-org-guard";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OrgSwitcher } from "./org-switcher";

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { currentOrg, membership } = useOrgStore();
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

  const navLinks = [
    {
      href: `/${locale}/org/listings`,
      label: t("dashboard.sidebar.listings"),
      icon: LayoutGrid,
    },
    {
      href: `/${locale}/org/members`,
      label: t("dashboard.sidebar.members"),
      icon: Users,
    },
    ...(role === "admin"
      ? [
          {
            href: `/${locale}/org/settings`,
            label: t("dashboard.sidebar.settings"),
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Org header */}
      <div className="flex items-center gap-3 px-4 py-5">
        <Avatar size="lg">
          {currentOrg?.photo?.url ? (
            <img
              src={currentOrg.photo.url}
              alt={orgName}
              className="aspect-square size-full rounded-full object-cover"
            />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {orgName}
          </p>
          {roleLabel && (
            <Badge variant="secondary" className="mt-0.5 text-xs">
              {roleLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={[
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-zinc-100 font-medium text-black"
                  : "text-zinc-600 hover:bg-zinc-50",
              ].join(" ")}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Org switcher */}
      <OrgSwitcher />
    </div>
  );
}

export function OrgSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile fixed header */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-zinc-200 bg-white px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" showCloseButton={false} className="w-60 p-0">
            <SidebarContent onNavClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Spacer so content doesn't go behind fixed header on mobile */}
      <div className="h-14 lg:hidden" />
    </>
  );
}
