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
      className="fixed bottom-6 right-6 z-40 flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-md text-zinc-600 hover:bg-zinc-50 transition-colors sm:hidden"
      aria-label="Scroll to top"
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
