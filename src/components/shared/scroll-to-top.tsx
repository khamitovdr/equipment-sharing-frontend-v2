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
      className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-md text-xs text-zinc-600 hover:bg-zinc-50 transition-colors sm:hidden"
      aria-label="Scroll to top"
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
