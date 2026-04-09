# Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dark theme support with system/light/dark modes, defaulting to system preference.

**Architecture:** `next-themes` ThemeProvider wraps the root layout, toggling a `.dark` class on `<html>`. A `.dark` CSS variable block in `globals.css` overrides the light palette. A single `ThemeToggle` cycle-button component is placed in the public navbar and dashboard sidebar.

**Tech Stack:** next-themes (already installed), Tailwind v4 `@custom-variant`, CSS custom properties (oklch), lucide-react icons, shadcn Button component.

---

### Task 1: Add dark CSS variables and Tailwind dark variant

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add the Tailwind v4 custom dark variant**

At the top of `src/app/globals.css`, after the existing `@import` lines (after line 3), add:

```css
@custom-variant dark (&:is(.dark *));
```

- [ ] **Step 2: Add the `.dark` CSS variable block**

After the closing `}` of the `:root` block (after line 89), add the dark theme variables. These are the shadcn neutral dark palette converted to oklch to match the existing light theme format:

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.871 0 0);
  --chart-1: oklch(0.269 0 0);
  --chart-2: oklch(0.371 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.556 0 0);
  --chart-5: oklch(0.87 0 0);
  --radius: 0.5rem;
  --sidebar: oklch(0.17 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.985 0 0);
  --sidebar-primary-foreground: oklch(0.145 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.871 0 0);
}
```

- [ ] **Step 3: Verify the CSS compiles**

Run: `npx next build --no-lint 2>&1 | tail -5` or `npx tailwindcss --help` to confirm no syntax errors. Alternatively, start dev server and check no CSS errors in terminal.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add dark theme CSS variables and Tailwind dark variant"
```

---

### Task 2: Wire up ThemeProvider in root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add ThemeProvider import and wrap the layout**

Replace the content of `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Equip Me",
  description: "Equipment rental platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Key changes from original:
- Import `ThemeProvider` from `next-themes`
- Add `suppressHydrationWarning` to `<html>`
- Wrap `{children}` with `<ThemeProvider>` inside `<body>`

- [ ] **Step 2: Verify dev server starts without errors**

Run: `npm run dev` and check the terminal for errors. Open the app in browser — should look identical to before (light theme still default via system preference on light OS).

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wrap root layout with next-themes ThemeProvider"
```

---

### Task 3: Create ThemeToggle component

**Files:**
- Create: `src/components/theme-toggle.tsx`

- [ ] **Step 1: Create the ThemeToggle component**

Create `src/components/theme-toggle.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify it renders**

Import and render `<ThemeToggle />` temporarily in any page to confirm it shows an icon and cycles through themes on click. Remove the temporary usage after verification.

- [ ] **Step 3: Commit**

```bash
git add src/components/theme-toggle.tsx
git commit -m "feat: add ThemeToggle cycle button component"
```

---

### Task 4: Add ThemeToggle to public navbar

**Files:**
- Modify: `src/components/layout/public-navbar.tsx`

- [ ] **Step 1: Add ThemeToggle to desktop header**

Add import at the top of the file (with the other imports):

```tsx
import { ThemeToggle } from "@/components/theme-toggle";
```

In the `{/* Desktop right */}` section (line 70), add `<ThemeToggle />` after `<LocaleSwitcher />` and before the auth conditional. The section becomes:

```tsx
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
      <Link href="/register" className={cn(buttonVariants({ size: "sm" }), "bg-black text-white hover:bg-zinc-800")}>
        {t("auth.register")}
      </Link>
    </>
  )}
</div>
```

- [ ] **Step 2: Add ThemeToggle to mobile drawer**

In the `MobileDrawer` component, add the import is already at the file top. In the bottom section where `<LocaleSwitcher />` is rendered (line 235-237), add `<ThemeToggle />` next to it:

```tsx
{/* Bottom: locale switcher + theme */}
<div className="border-t border-zinc-200 px-5 py-3 flex items-center justify-between">
  <LocaleSwitcher />
  <ThemeToggle />
</div>
```

- [ ] **Step 3: Verify in browser**

Open the public pages. Confirm:
- Desktop: theme toggle icon visible next to locale switcher
- Mobile: theme toggle visible in the bottom of the drawer
- Clicking cycles through system → light → dark → system
- Dark mode activates and deactivates correctly

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/public-navbar.tsx
git commit -m "feat: add theme toggle to public navbar"
```

---

### Task 5: Add ThemeToggle to dashboard sidebar

**Files:**
- Modify: `src/components/layout/org-sidebar.tsx`

- [ ] **Step 1: Add ThemeToggle to SidebarContent**

Add import at the top:

```tsx
import { ThemeToggle } from "@/components/theme-toggle";
```

In the `SidebarContent` component, add the `<ThemeToggle />` between the nav and the `<OrgSwitcher />`. The bottom of the `SidebarContent` return becomes:

```tsx
    </nav>

    {/* Theme toggle */}
    <div className="px-3 pb-1">
      <ThemeToggle />
    </div>

    {/* Org switcher */}
    <OrgSwitcher />
  </div>
```

- [ ] **Step 2: Verify in browser**

Open the dashboard. Confirm:
- Desktop sidebar: theme toggle visible above org switcher
- Mobile drawer: theme toggle visible in the same position
- Clicking cycles themes and the sidebar itself updates colors

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/org-sidebar.tsx
git commit -m "feat: add theme toggle to dashboard sidebar"
```

---

### Task 6: Fix hardcoded colors for dark mode compatibility

**Files:**
- Modify: `src/components/layout/public-navbar.tsx`
- Modify: `src/components/layout/org-sidebar.tsx`

- [ ] **Step 1: Fix hardcoded colors in public-navbar.tsx**

Several elements in `public-navbar.tsx` use hardcoded colors that won't adapt to dark mode. Replace:

1. **Logo component** (lines 30-31): `bg-black text-white` → `bg-primary text-primary-foreground`; `text-black` → `text-foreground`

```tsx
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
```

2. **Header element** (line 51): `border-zinc-200 bg-white` → `border-border bg-background`

```tsx
<header className="sticky top-0 z-40 w-full border-b border-border bg-background">
```

3. **Desktop nav links** (line 62): `text-zinc-600 hover:text-black` → `text-muted-foreground hover:text-foreground`

4. **Register button** (line 82): `bg-black text-white hover:bg-zinc-800` → `bg-primary text-primary-foreground hover:bg-primary/90`

5. **Mobile drawer** — fix all hardcoded `border-zinc-200`, `text-zinc-600`, `hover:bg-zinc-100`, `text-zinc-500`, `border-zinc-100`, `bg-red-50`, `text-red-600`, `hover:text-red-700` etc. to use semantic tokens:
   - `border-zinc-200` → `border-border`
   - `text-zinc-700` → `text-foreground`  
   - `text-zinc-600` → `text-muted-foreground`
   - `text-zinc-500` → `text-muted-foreground`
   - `text-zinc-400` → `text-muted-foreground`
   - `hover:bg-zinc-100` → `hover:bg-muted`
   - `hover:text-black` → `hover:text-foreground`
   - `border-zinc-100` → `border-border`
   - `text-red-600 hover:bg-red-50 hover:text-red-700` → `text-destructive hover:bg-destructive/10 hover:text-destructive`
   - `bg-black text-white hover:bg-zinc-800` → `bg-primary text-primary-foreground hover:bg-primary/90`

- [ ] **Step 2: Fix hardcoded colors in org-sidebar.tsx**

1. **Logo link** (lines 53-59): same pattern as public navbar Logo — `bg-black text-white` → `bg-primary text-primary-foreground`; `text-black` → `text-foreground`

2. **Desktop aside** (line 98): `border-zinc-200 bg-white` → `border-border bg-background`

3. **Nav links** (lines 72-76):
   - `bg-zinc-100 font-medium text-black` → `bg-muted font-medium text-foreground`
   - `text-zinc-600 hover:bg-zinc-50` → `text-muted-foreground hover:bg-muted/50`

4. **Mobile header** (line 103): `border-zinc-200 bg-white` → `border-border bg-background`

5. **Mobile trigger** (line 107): `text-zinc-600 hover:bg-zinc-50` → `text-muted-foreground hover:bg-muted/50`

6. **Mobile header logo** (lines 116-122): same Logo fixes — `bg-black text-white` → `bg-primary text-primary-foreground`; `text-black` → `text-foreground`

- [ ] **Step 3: Verify in browser**

Toggle between light and dark themes. Confirm:
- Public navbar: background, text, borders all adapt
- Dashboard sidebar: background, nav links, active state all adapt
- Logos render correctly in both themes
- No hardcoded white/black backgrounds visible in dark mode

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/public-navbar.tsx src/components/layout/org-sidebar.tsx
git commit -m "fix: replace hardcoded colors with semantic tokens for dark mode"
```

---

### Task 7: Final verification

- [ ] **Step 1: Test all three theme modes**

For each mode (system, light, dark):
1. Click the theme toggle to set the mode
2. Check these pages:
   - Public home page
   - Public listings page
   - Login/register pages
   - Dashboard listings page
   - Dashboard orders page
   - Dashboard settings page
3. Confirm no jarring white/black patches, text is readable, borders visible

- [ ] **Step 2: Test persistence**

1. Set theme to "dark"
2. Refresh the page
3. Confirm dark theme persists (no flash of light theme)

- [ ] **Step 3: Test system preference**

1. Set theme to "system"
2. Toggle OS dark mode
3. Confirm app follows the OS preference

- [ ] **Step 4: Test Sonner toasts**

Trigger a toast notification in dark mode. Confirm it uses dark styling (already wired via `useTheme()` in `src/components/ui/sonner.tsx`).
