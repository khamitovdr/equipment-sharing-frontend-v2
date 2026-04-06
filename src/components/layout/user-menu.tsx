"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LogOut, ShoppingBag, Settings, Building2, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

export function UserMenu() {
  const t = useTranslations();
  const { user, logout } = useAuth();

  const initials = user
    ? [user.name, user.surname]
        .filter(Boolean)
        .map((s) => s[0].toUpperCase())
        .join("")
    : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="text-sm font-medium text-foreground">
            {[user?.name, user?.surname].filter(Boolean).join(" ") || t("common.appName")}
          </span>
          <span className="text-xs text-muted-foreground">
            {user?.email}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/orders" />}>
          <ShoppingBag />
          {t("nav.myOrders")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings />
          {t("nav.settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/organizations/new" />}>
          <Building2 />
          {t("nav.createOrg")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <UserPlus />
          {t("nav.joinOrg")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={logout}>
          <LogOut />
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
