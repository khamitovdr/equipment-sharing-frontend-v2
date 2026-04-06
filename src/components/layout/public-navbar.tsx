"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded bg-black text-white text-sm font-bold leading-none">
        E
      </span>
      <span className="text-sm font-semibold tracking-tight text-black">
        equip me
      </span>
    </Link>
  );
}

const navLinks = [
  { href: "/", labelKey: "nav.home" as const },
  { href: "/listings", labelKey: "nav.catalog" as const },
] as const;

export function PublicNavbar() {
  const t = useTranslations();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, labelKey }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-zinc-600 hover:text-black transition-colors"
            >
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <LocaleSwitcher />
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />}>
                {t("auth.login")}
              </Button>
              <Button size="sm" className="bg-black text-white hover:bg-zinc-800" nativeButton={false} render={<Link href="/register" />}>
                {t("auth.register")}
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" showCloseButton={false} className="w-72 p-0">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <Logo />
                <SheetClose className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </SheetClose>
              </div>
              <nav className="flex flex-col px-4 py-4 gap-1">
                {navLinks.map(({ href, labelKey }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-2 py-2 text-sm text-zinc-700 hover:bg-muted hover:text-black transition-colors"
                  >
                    {t(labelKey)}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-zinc-200 px-4 py-4 flex flex-col gap-3">
                <LocaleSwitcher />
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <UserMenu />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      nativeButton={false} render={<Link href="/login" onClick={() => setMobileOpen(false)} />}
                    >
                      {t("auth.login")}
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-black text-white hover:bg-zinc-800"
                      nativeButton={false} render={<Link href="/register" onClick={() => setMobileOpen(false)} />}
                    >
                      {t("auth.register")}
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
