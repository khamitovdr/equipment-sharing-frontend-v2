"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed top-16 inset-x-0 mx-auto w-fit z-40 flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 shadow-md text-xs text-muted-foreground hover:bg-muted/50 transition-colors sm:hidden"
      aria-label="Scroll to top"
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
