"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LayoutGrid, Users, Settings, Menu, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useOrgGuard } from "@/lib/hooks/use-org-guard";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { OrgSwitcher } from "./org-switcher";

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { role } = useOrgGuard();

  const navLinks = [
    {
      href: `/${locale}/org/listings`,
      label: t("dashboard.sidebar.listings"),
      icon: LayoutGrid,
    },
    {
      href: `/${locale}/org/orders`,
      label: t("dashboard.sidebar.orders"),
      icon: ShoppingBag,
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
      {/* Logo — link to home */}
      <Link href={`/${locale}`} onClick={onNavClick} className="flex items-center gap-2 border-b border-border px-4 py-4">
        <span className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-bold leading-none">
          E
        </span>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          equip me
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-3 pt-4">
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
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50",
              ].join(" ")}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 pb-1">
        <ThemeToggle />
      </div>

      {/* Org switcher */}
      <OrgSwitcher />
    </div>
  );
}

export function OrgSidebar() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-background lg:block h-screen sticky top-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile fixed header */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" showCloseButton={false} className="w-60 p-0">
            <SidebarContent onNavClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-bold leading-none">
            E
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            equip me
          </span>
        </Link>
      </div>

    </>
  );
}
