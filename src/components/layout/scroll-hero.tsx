"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function ScrollHero() {
  const t = useTranslations();
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleScroll() {
      if (!sectionRef.current || !line1Ref.current || !line2Ref.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      // Progress: 0 when section top is at viewport top, 1 when section is fully scrolled past
      const progress = Math.max(0, Math.min(1, -rect.top / sectionHeight));

      const shift = progress * 120; // pixels to shift
      line1Ref.current.style.transform = `translateX(${-shift}px)`;
      line2Ref.current.style.transform = `translateX(${shift}px)`;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial position
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b bg-zinc-50 py-24 sm:py-32 lg:py-40"
    >
      {/* Scrolling typography */}
      <div className="flex flex-col items-center gap-2 sm:gap-4">
        <div
          ref={line1Ref}
          className="whitespace-nowrap text-5xl font-black uppercase tracking-tighter text-black sm:text-7xl lg:text-8xl xl:text-9xl"
          style={{ willChange: "transform" }}
        >
          {t("home.hero.line1")}
        </div>
        <div
          ref={line2Ref}
          className="whitespace-nowrap text-5xl font-black uppercase tracking-tighter text-zinc-300 sm:text-7xl lg:text-8xl xl:text-9xl"
          style={{ willChange: "transform" }}
        >
          {t("home.hero.line2")}
        </div>
      </div>

      {/* Subtitle + CTA centered on top */}
      <div className="relative z-10 mt-10 flex flex-col items-center gap-6 px-4 text-center">
        <p className="max-w-md text-sm text-zinc-500 sm:text-base">
          {t("home.hero.subtitle")}
        </p>
        <Link
          href="/listings"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          {t("home.hero.cta")}
        </Link>
      </div>
    </section>
  );
}
