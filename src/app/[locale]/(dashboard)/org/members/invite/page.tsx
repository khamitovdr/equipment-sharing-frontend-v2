"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSearch } from "@/components/org/user-search";
import { organizationsApi } from "@/lib/api/organizations";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrgGuard } from "@/lib/hooks/use-org-guard";
import { ApiRequestError } from "@/lib/api/client";
import type { UserRead } from "@/types/user";
import type { MembershipRole } from "@/types/organization";

export default function InviteMemberPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const orgId = useOrgStore((s) => s.membership?.organization_id);
  const { hasRole } = useOrgGuard({ minRole: "admin" });

  const [selectedUser, setSelectedUser] = useState<UserRead | null>(null);
  const [role, setRole] = useState<MembershipRole>("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!hasRole || !orgId) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !orgId || !selectedUser) return;

    setIsSubmitting(true);
    try {
      await organizationsApi.inviteMember(token, orgId, {
        user_id: selectedUser.id,
        role,
      });
      toast.success(t("invite.success"));
      router.push(`/${locale}/org/members`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        toast.error(t("invite.error.alreadyMember"));
      } else {
        toast.error(t("common.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("invite.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>{t("invite.search.label")}</Label>
              <UserSearch
                selectedUser={selectedUser}
                onSelect={setSelectedUser}
                onClear={() => setSelectedUser(null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-select">{t("invite.role.label")}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as MembershipRole)}
              >
                <SelectTrigger id="role-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    {t("members.role.admin")}
                  </SelectItem>
                  <SelectItem value="editor">
                    {t("members.role.editor")}
                  </SelectItem>
                  <SelectItem value="viewer">
                    {t("members.role.viewer")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!selectedUser || isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("invite.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
