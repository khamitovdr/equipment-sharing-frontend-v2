# Dark Theme Design

## Overview

Add dark theme support to Equip Me with three modes: **system** (default), **light**, and **dark**. Leverages the existing `next-themes` dependency, shadcn/ui CSS variable architecture, and orphaned `dark:` Tailwind classes already present in components.

## Approach

`next-themes` + CSS variable overrides (class-based). The `.dark` class on `<html>` activates Tailwind's `dark:` variant and swaps CSS custom properties to dark values.

## Theme Infrastructure

### ThemeProvider

Wrap the app at the root layout (`src/app/layout.tsx`) with `ThemeProvider` from `next-themes`:

- `attribute="class"` — toggles `.dark` class on `<html>`
- `defaultTheme="system"` — respects OS preference out of the box
- `enableSystem={true}`
- `disableTransitionOnChange` — prevents visual flash during theme switch
- Add `suppressHydrationWarning` to the `<html>` tag (required by next-themes)

### Tailwind v4 Dark Mode Activation

Add a custom variant directive to `globals.css` to enable class-based dark mode:

```css
@custom-variant dark (&:is(.dark *));
```

This activates all existing `dark:` prefixed classes in shadcn components.

## Dark Color Palette

Add a `.dark` selector block in `globals.css` after the `:root` block. Uses shadcn's standard neutral dark palette in oklch color space, overriding all existing light tokens:

| Token | Light (existing) | Dark |
|-------|------------------|------|
| `--background` | `oklch(1 0 0)` (white) | `oklch(0.145 0 0)` (near-black) |
| `--foreground` | `oklch(0.09 0 0)` (near-black) | `oklch(0.985 0 0)` (near-white) |
| `--primary` | `oklch(0.12 0 0)` (black) | `oklch(0.985 0 0)` (white) |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `--secondary` | `oklch(0.967 0 0)` (zinc-100) | `oklch(0.269 0 0)` (zinc-800) |
| `--muted` | `oklch(0.967 0 0)` | `oklch(0.269 0 0)` |
| `--accent` | `oklch(0.967 0 0)` | `oklch(0.269 0 0)` |
| `--border` | `oklch(0.922 0 0)` (zinc-200) | `oklch(0.269 0 0)` (zinc-800) |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |

Full token set includes card, popover, input, ring, chart, and sidebar variants — all following the same inversion pattern.

## ThemeToggle Component

### Behavior

- Single reusable component: `src/components/theme-toggle.tsx`
- **Cycle button**: each click advances through system → light → dark → system
- Icon reflects current state:
  - System: `Monitor` (lucide-react)
  - Light: `Sun` (lucide-react)
  - Dark: `Moon` (lucide-react)
- Uses `useTheme()` hook from `next-themes`
- Renders as shadcn `Button` with `variant="ghost"` and `size="icon"`
- Includes mounted check to prevent hydration mismatch (renders nothing server-side)

### Placement

| Location | File | Position |
|----------|------|----------|
| Public navbar | `src/components/layout/public-navbar.tsx` | Next to `LocaleSwitcher`, before `NotificationBell` |
| Dashboard sidebar | `src/components/layout/org-sidebar.tsx` | Bottom, above `OrgSwitcher` |
| Mobile drawers | Both mobile nav menus | Included for small screen access |

Same component in all locations — no logic duplication.

## Files Changed

| File | Change |
|------|--------|
| `src/app/globals.css` | Add `@custom-variant dark`, add `.dark` CSS variable block |
| `src/app/layout.tsx` | Wrap with `ThemeProvider`, add `suppressHydrationWarning` |
| `src/components/theme-toggle.tsx` | New — cycle button component |
| `src/components/layout/public-navbar.tsx` | Add `ThemeToggle` to header controls |
| `src/components/layout/org-sidebar.tsx` | Add `ThemeToggle` to sidebar bottom |

## Edge Cases

- **Persistence**: `next-themes` stores preference in `localStorage` automatically
- **System preference changes**: Detected in real-time via `matchMedia` listener
- **No FOUC**: `next-themes` injects an inline script that sets the class before first paint
- **SSR**: `suppressHydrationWarning` on `<html>` prevents React warnings
- **Sonner toasts**: Already using `useTheme()` — will respect theme automatically

## Out of Scope

- Custom color picker or per-page themes
- Animated transitions between themes
- Theme-aware images/logos (can be added later if needed)
