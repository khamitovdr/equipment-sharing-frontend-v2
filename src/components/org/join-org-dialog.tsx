"use client";

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { organizationsApi } from "@/lib/api/organizations";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ApiRequestError } from "@/lib/api/client";
import type { OrganizationListRead } from "@/types/organization";

interface JoinOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinOrgDialog({ open, onOpenChange }: JoinOrgDialogProps) {
  const t = useTranslations("joinOrg");
  const token = useAuthStore((s) => s.token);

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<OrganizationListRead[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [joining, setJoining] = React.useState<string | null>(null);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setLoading(false);
      setJoining(null);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [open]);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await organizationsApi.list({ search: value.trim() });
        setResults(data.items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  async function handleSelect(org: OrganizationListRead) {
    if (!token || joining) return;
    setJoining(org.id);
    try {
      await organizationsApi.joinOrg(token, org.id);
      toast.success(t("success"));
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        toast.error(t("error.alreadyMember"));
      } else {
        toast.error(t("error.alreadyMember"));
      }
    } finally {
      setJoining(null);
    }
  }

  function getInitials(org: OrganizationListRead): string {
    const name = org.short_name ?? org.full_name ?? "";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

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
            onChange={handleQueryChange}
            autoComplete="off"
            autoFocus
          />
        </div>

        {query.trim() && !loading && results.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            {t("search.noResults")}
          </p>
        )}

        {results.length > 0 && (
          <ul className="mt-1 max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {results.map((org) => {
              const isJoining = joining === org.id;
              return (
                <li key={org.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => handleSelect(org)}
                    disabled={!!joining}
                  >
                    <Avatar size="sm">
                      {org.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={org.photo.small_url ?? org.photo.medium_url}
                          alt={org.short_name ?? ""}
                          className="aspect-square size-full rounded-full object-cover"
                        />
                      ) : null}
                      <AvatarFallback>{getInitials(org)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {org.short_name ?? org.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {org.inn}
                      </p>
                    </div>
                    {isJoining && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
