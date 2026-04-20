"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export const IN_APP_NAV_STORAGE_KEY = "hasInAppNav";

export function NavigationTracker() {
  const pathname = usePathname();
  const initial = useRef(true);

  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    sessionStorage.setItem(IN_APP_NAV_STORAGE_KEY, "1");
  }, [pathname]);

  return null;
}
