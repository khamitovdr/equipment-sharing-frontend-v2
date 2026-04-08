import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as cost: space as thousands separator, comma as decimal. */
export function formatCost(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "—";
  const [int, dec] = num.toFixed(2).split(".");
  const withSpaces = int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  if (dec === "00") return withSpaces;
  return `${withSpaces},${dec}`;
}
