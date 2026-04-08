"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { UserRead } from "@/types/user";

export interface UserSearchProps {
  onSelect: (user: UserRead) => void;
  selectedUser: UserRead | null;
  onClear: () => void;
}

function getUserInitials(user: UserRead): string {
  return [user.name, user.surname]
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function getUserFullName(user: UserRead): string {
  return [user.surname, user.name, user.middle_name]
    .filter(Boolean)
    .join(" ");
}

export function UserSearch({ onSelect, selectedUser, onClear }: UserSearchProps) {
  const t = useTranslations("invite");
  const token = useAuthStore((s) => s.token);

  const [inputValue, setInputValue] = React.useState("");
  const [debouncedEmail, setDebouncedEmail] = React.useState("");
  const [showDropdown, setShowDropdown] = React.useState(false);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setDebouncedEmail(value);
    }, 300);
  }

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const enabled = debouncedEmail.length >= 3 && !selectedUser && !!token;

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["user-search", debouncedEmail],
    queryFn: () => usersApi.search(token!, { email: debouncedEmail, limit: 5 }),
    enabled,
    staleTime: 30_000,
  });

  React.useEffect(() => {
    if (enabled) {
      setShowDropdown(true);
    }
  }, [enabled]);

  function handleSelect(user: UserRead) {
    onSelect(user);
    setInputValue("");
    setDebouncedEmail("");
    setShowDropdown(false);
  }

  function handleClear() {
    onClear();
    setInputValue("");
    setDebouncedEmail("");
    setShowDropdown(false);
  }

  const showHint = !selectedUser && inputValue.length > 0 && inputValue.length < 3;
  const showNoResults =
    !selectedUser &&
    debouncedEmail.length >= 3 &&
    !isFetching &&
    results.length === 0 &&
    showDropdown;
  const showResults =
    !selectedUser &&
    debouncedEmail.length >= 3 &&
    results.length > 0 &&
    showDropdown;

  return (
    <div className="space-y-2">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground">
          {isFetching && !selectedUser ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </span>
        <Input
          type="email"
          className="pl-8"
          placeholder={t("search.placeholder")}
          value={inputValue}
          onChange={handleInputChange}
          disabled={!!selectedUser}
          autoComplete="off"
          onFocus={() => {
            if (debouncedEmail.length >= 3) setShowDropdown(true);
          }}
          onBlur={() => {
            // delay to allow click on dropdown items
            setTimeout(() => setShowDropdown(false), 150);
          }}
        />
      </div>

      {showHint && (
        <p className="text-xs text-muted-foreground">{t("search.minChars")}</p>
      )}

      {showNoResults && (
        <p className="text-sm text-muted-foreground py-2 text-center">
          {t("search.noResults")}
        </p>
      )}

      {showResults && (
        <ul className="max-h-60 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {isFetching && (
            <li className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </li>
          )}
          {!isFetching &&
            results.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(user);
                  }}
                >
                  <Avatar size="sm">
                    {user.profile_photo?.small_url && (
                      <AvatarImage src={user.profile_photo.small_url} alt={getUserFullName(user)} />
                    )}
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {getUserFullName(user)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </button>
              </li>
            ))}
        </ul>
      )}

      {selectedUser && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <Avatar size="sm">
            {selectedUser.profile_photo?.small_url && (
              <AvatarImage src={selectedUser.profile_photo.small_url} alt={getUserFullName(selectedUser)} />
            )}
            <AvatarFallback>{getUserInitials(selectedUser)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {getUserFullName(selectedUser)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {selectedUser.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
