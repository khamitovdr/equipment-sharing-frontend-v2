"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const themes = ["system", "light", "dark"] as const;

const icons = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const;

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" disabled aria-hidden />;
  }

  const current = (theme ?? "system") as (typeof themes)[number];
  const nextIndex = (themes.indexOf(current) + 1) % themes.length;
  const next = themes[nextIndex];
  const Icon = icons[current];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
    >
      <Icon className="size-4" />
    </Button>
  );
}
