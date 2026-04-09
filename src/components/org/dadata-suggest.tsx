"use client";

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import type { DadataSuggestion, DadataSuggestResponse } from "@/types/dadata";

interface DadataSuggestProps {
  onSelect: (suggestion: DadataSuggestion) => void;
  disabled?: boolean;
}

export function DadataSuggest({ onSelect, disabled }: DadataSuggestProps) {
  const t = useTranslations("orgCreate");

  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<DadataSuggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/dadata/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: value }),
        });
        if (res.ok) {
          const data: DadataSuggestResponse = await res.json();
          setSuggestions(data.suggestions ?? []);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(suggestion: DadataSuggestion) {
    setQuery(suggestion.data.name.short_with_opf ?? suggestion.value);
    setSuggestions([]);
    setOpen(false);
    onSelect(suggestion);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </span>
        <Input
          type="text"
          className="pl-8"
          placeholder={t("search.placeholder")}
          value={query}
          onChange={handleChange}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-md">
          {suggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t("search.noResults")}
            </div>
          ) : (
            <ul>
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                    onClick={() => handleSelect(s)}
                  >
                    <span className="block text-sm font-medium leading-tight">
                      {s.data.name.short_with_opf ?? s.value}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t("details.inn")} {s.data.inn}
                      {s.data.address?.value ? ` · ${s.data.address.value}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
