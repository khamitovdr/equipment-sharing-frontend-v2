"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(nextLocale: string) {
    if (nextLocale === locale) return;
    // pathname includes the locale prefix, e.g. /ru/catalog
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    router.push(segments.join("/"));
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => switchLocale("ru")}
        className={
          locale === "ru"
            ? "font-bold text-foreground"
            : "text-muted-foreground hover:text-foreground transition-colors"
        }
      >
        RU
      </button>
      <span className="text-muted-foreground">/</span>
      <button
        onClick={() => switchLocale("en")}
        className={
          locale === "en"
            ? "font-bold text-foreground"
            : "text-muted-foreground hover:text-foreground transition-colors"
        }
      >
        EN
      </button>
    </div>
  );
}
