"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Menu, X, Home, Search, ShoppingBag, Settings, LayoutDashboard,
  Building2, UserPlus, Bell, LogOut,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { JoinOrgDialog } from "@/components/org/join-org-dialog";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-bold leading-none">
        E
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">
        equip me
      </span>
    </Link>
  );
}

const navLinks = [
  { href: "/", labelKey: "nav.home" as const },
  { href: "/listings", labelKey: "nav.catalog" as const },
  { href: "/orders", labelKey: "nav.orders" as const, authRequired: true },
] as const;

export function PublicNavbar() {
  const t = useTranslations();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, labelKey, ...rest }) => (
            <Link
              key={href}
              href={"authRequired" in rest && !isAuthenticated ? "/login" : href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                {t("auth.login")}
              </Link>
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }), "bg-primary text-primary-foreground hover:bg-primary/90")}>
                {t("auth.register")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden">
          <MobileDrawer />
        </div>
      </div>
    </header>
  );
}

const navItemClass =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground transition-colors";

function MobileDrawer() {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const { user, logout } = useAuth();
  const { data: orgsData } = useQuery({
    queryKey: ["user-organizations"],
    queryFn: () => usersApi.myOrganizations(token!),
    enabled: !!token,
    staleTime: 60_000,
  });
  const hasOrgs = (orgsData?.items?.length ?? 0) > 0;

  const close = () => setOpen(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="right" showCloseButton={false} className="w-72 p-0">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Logo />
              <SheetClose className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>

            {/* User info */}
            {isAuthenticated && user && (
              <div className="border-b border-border px-5 py-3">
                <p className="text-sm font-medium truncate">
                  {[user.name, user.surname].filter(Boolean).join(" ")}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              {/* Main nav */}
              <Link href={`/${locale}`} onClick={close} className={navItemClass}>
                <Home className="size-4 shrink-0" />
                {t("nav.home")}
              </Link>
              <Link href={`/${locale}/listings`} onClick={close} className={navItemClass}>
                <Search className="size-4 shrink-0" />
                {t("nav.catalog")}
              </Link>
              <Link href={isAuthenticated ? `/${locale}/orders` : `/${locale}/login`} onClick={close} className={navItemClass}>
                <ShoppingBag className="size-4 shrink-0" />
                {t("nav.orders")}
              </Link>

              {isAuthenticated && (
                <>
                  <Link href={`/${locale}/settings`} onClick={close} className={navItemClass}>
                    <Settings className="size-4 shrink-0" />
                    {t("nav.settings")}
                  </Link>

                  <div className="my-2 border-t border-border" />
                  {hasOrgs && (
                    <Link href={`/${locale}/org`} onClick={close} className={navItemClass}>
                      <LayoutDashboard className="size-4 shrink-0" />
                      {t("nav.dashboard")}
                    </Link>
                  )}
                  <Link href={`/${locale}/organizations/new`} onClick={close} className={navItemClass}>
                    <Building2 className="size-4 shrink-0" />
                    {t("nav.createOrg")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => { close(); setJoinOpen(true); }}
                    className={cn(navItemClass, "w-full text-left")}
                  >
                    <UserPlus className="size-4 shrink-0" />
                    {t("nav.joinOrg")}
                  </button>

                  <div className="my-2 border-t border-border" />
                  <div className={cn(navItemClass, "text-muted-foreground cursor-default")}>
                    <Bell className="size-4 shrink-0" />
                    {t("common.comingSoon")}
                  </div>

                  <div className="my-2 border-t border-border" />
                  <button
                    type="button"
                    onClick={() => { close(); logout(); }}
                    className={cn(navItemClass, "w-full text-left text-destructive hover:bg-destructive/10 hover:text-destructive")}
                  >
                    <LogOut className="size-4 shrink-0" />
                    {t("nav.logout")}
                  </button>
                </>
              )}

              {!isAuthenticated && (
                <>
                  <div className="my-2 border-t border-border" />
                  <div className="flex flex-col gap-2 px-1">
                    <Link
                      href={`/${locale}/login`}
                      onClick={close}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
                    >
                      {t("auth.login")}
                    </Link>
                    <Link
                      href={`/${locale}/register`}
                      onClick={close}
                      className={cn(buttonVariants({ size: "sm" }), "w-full bg-primary text-primary-foreground hover:bg-primary/90")}
                    >
                      {t("auth.register")}
                    </Link>
                  </div>
                </>
              )}
            </nav>

            {/* Bottom: locale switcher + theme */}
            <div className="border-t border-border px-5 py-3 flex items-center justify-between">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <JoinOrgDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  );
}
