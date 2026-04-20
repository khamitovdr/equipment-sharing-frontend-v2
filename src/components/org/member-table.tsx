"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Shield, Loader2 } from "lucide-react";

import { organizationsApi } from "@/lib/api/organizations";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useApiErrorToast } from "@/lib/hooks/use-api-error-toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { MembershipRead, MembershipRole } from "@/types/organization";
import type { UserRead } from "@/types/user";

interface MemberTableProps {
  members: MembershipRead[];
  users: Record<string, UserRead>;
  tab: "members" | "pending" | "invitations";
  isAdmin: boolean;
  currentUserId: string;
  orgId: string;
}

function getUserInitials(user: UserRead | undefined): string {
  if (!user) return "?";
  const first = user.name?.[0] ?? "";
  const last = user.surname?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

function getUserName(user: UserRead | undefined): string {
  if (!user) return "—";
  const parts = [user.surname, user.name, user.middle_name].filter(Boolean);
  return parts.join(" ") || user.email;
}

const ROLE_BADGE_VARIANT: Record<
  MembershipRole,
  "default" | "secondary" | "outline"
> = {
  admin: "default",
  editor: "secondary",
  viewer: "outline",
};

export function MemberTable({
  members,
  users,
  tab,
  isAdmin,
  currentUserId,
  orgId,
}: MemberTableProps) {
  const t = useTranslations();
  const locale = useLocale();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const toastError = useApiErrorToast();

  // Remove / reject / cancel state
  const [removeTarget, setRemoveTarget] = useState<MembershipRead | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Role change loading
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // Approve flow state: { memberId, role }
  const [approveState, setApproveState] = useState<{
    member: MembershipRead;
    role: MembershipRole;
  } | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["members", orgId] });
  }, [queryClient, orgId]);

  // ── Role change (members tab) ──────────────────────────────────────
  const handleRoleChange = useCallback(
    async (member: MembershipRead, role: MembershipRole) => {
      if (!token) return;
      setUpdatingRoleId(member.id);
      try {
        await organizationsApi.updateMemberRole(token, orgId, member.id, { role });
        invalidate();
        toast.success(t("members.roleChanged"));
      } catch (err) {
        toastError(err, t("errors.serverError"));
      } finally {
        setUpdatingRoleId(null);
      }
    },
    [token, orgId, invalidate, t, toastError]
  );

  // ── Remove / Reject / Cancel ───────────────────────────────────────
  const handleRemoveConfirm = useCallback(async () => {
    if (!token || !removeTarget) return;
    setIsRemoving(true);
    try {
      await organizationsApi.removeMember(token, orgId, removeTarget.id);
      invalidate();
      if (tab === "members") toast.success(t("members.removed"));
      else if (tab === "pending") toast.success(t("members.rejected"));
      else toast.success(t("members.inviteCanceled"));
    } catch (err) {
      toastError(err, t("errors.serverError"));
    } finally {
      setIsRemoving(false);
      setRemoveTarget(null);
    }
  }, [token, orgId, removeTarget, tab, invalidate, t, toastError]);

  // ── Approve (pending tab) ─────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!token || !approveState) return;
    setIsApproving(true);
    try {
      await organizationsApi.approveMember(token, orgId, approveState.member.id, {
        role: approveState.role,
      });
      invalidate();
      toast.success(t("members.approved"));
    } catch (err) {
      toastError(err, t("errors.serverError"));
    } finally {
      setIsApproving(false);
      setApproveState(null);
    }
  }, [token, orgId, approveState, invalidate, t, toastError]);

  // ── Resolve confirm dialog description ───────────────────────────
  const removeDescription = removeTarget
    ? t("members.removeConfirm", {
        name: getUserName(users[removeTarget.user_id]),
      })
    : "";

  const removeTitle =
    tab === "members"
      ? t("members.actions.remove")
      : tab === "pending"
      ? t("members.actions.reject")
      : t("members.actions.cancelInvite");

  if (members.length === 0) return null;

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {members.map((member) => {
              const user = users[member.user_id];
              const isSelf = member.user_id === currentUserId;

              return (
                <tr
                  key={member.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  {/* Avatar */}
                  <td className="p-3 w-12">
                    <Avatar>
                      {user?.profile_photo?.small_url && (
                        <AvatarImage src={user.profile_photo.small_url} alt={getUserName(user)} />
                      )}
                      <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                    </Avatar>
                  </td>

                  {/* Name */}
                  <td className="p-3 font-medium">
                    <div>{getUserName(user)}</div>
                    {isSelf && (
                      <span className="text-xs text-muted-foreground">
                        ({t("common.you") ?? "you"})
                      </span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">
                    {user?.email ?? "—"}
                  </td>

                  {/* Role badge (members & invitations tabs) / date (pending) */}
                  {tab === "members" && (
                    <td className="p-3">
                      <Badge variant={ROLE_BADGE_VARIANT[member.role]}>
                        <Shield className="size-3 mr-1" />
                        {t(`members.role.${member.role}`)}
                      </Badge>
                    </td>
                  )}

                  {tab === "invitations" && (
                    <>
                      <td className="p-3">
                        <Badge variant={ROLE_BADGE_VARIANT[member.role]}>
                          <Shield className="size-3 mr-1" />
                          {t(`members.role.${member.role}`)}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">
                        {formatDate(member.created_at, locale)}
                      </td>
                    </>
                  )}

                  {tab === "pending" && (
                    <td className="p-3 text-muted-foreground hidden md:table-cell">
                      {formatDate(member.created_at, locale)}
                    </td>
                  )}

                  {/* Actions */}
                  <td className="p-3 text-right">
                    {tab === "members" && (
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && !isSelf && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-8 p-0"
                                />
                              }
                            >
                              {updatingRoleId === member.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="size-4" />
                              )}
                              <span className="sr-only">Actions</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={member.role === "admin"}
                                onClick={() =>
                                  handleRoleChange(member, "admin")
                                }
                              >
                                {t("members.role.admin")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={member.role === "editor"}
                                onClick={() =>
                                  handleRoleChange(member, "editor")
                                }
                              >
                                {t("members.role.editor")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={member.role === "viewer"}
                                onClick={() =>
                                  handleRoleChange(member, "viewer")
                                }
                              >
                                {t("members.role.viewer")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setRemoveTarget(member)}
                              >
                                {t("members.actions.remove")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    )}

                    {tab === "pending" && isAdmin && (
                      <div className="flex items-center justify-end gap-2">
                        {/* Approve with role select */}
                        {approveState?.member.id === member.id ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={approveState.role}
                              onValueChange={(v) =>
                                setApproveState((s) =>
                                  s ? { ...s, role: v as MembershipRole } : s
                                )
                              }
                            >
                              <SelectTrigger size="sm" className="w-32">
                                <SelectValue>
                                  {t(`members.role.${approveState?.role ?? "viewer"}`)}
                                </SelectValue>
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
                            <Button
                              size="sm"
                              onClick={handleApprove}
                              disabled={isApproving}
                            >
                              {isApproving && (
                                <Loader2 className="size-3 mr-1 animate-spin" />
                              )}
                              {t("members.actions.approve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setApproveState(null)}
                            >
                              {t("common.cancel")}
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setApproveState({
                                  member,
                                  role: "viewer",
                                })
                              }
                            >
                              {t("members.actions.approve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRemoveTarget(member)}
                            >
                              {t("members.actions.reject")}
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {tab === "invitations" && isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRemoveTarget(member)}
                      >
                        {t("members.actions.cancelInvite")}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Remove / Reject / Cancel confirm dialog */}
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title={removeTitle}
        description={removeDescription}
        onConfirm={handleRemoveConfirm}
      />
    </>
  );
}
