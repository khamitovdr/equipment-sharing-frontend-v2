"use client";

import { useState, useCallback } from "react";
import { useForm, type Control, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

import { useOrgGuard } from "@/lib/hooks/use-org-guard";
import { useOrg } from "@/lib/hooks/use-org";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { organizationsApi } from "@/lib/api/organizations";
import { mediaApi } from "@/lib/api/media";
import {
  contactsReplaceSchema,
  type ContactsReplaceFormData,
} from "@/lib/validators/organization";

import { AvatarUpload } from "@/components/media/avatar-upload";
import { ContactsEditor } from "@/components/org/contacts-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type UploadState = "idle" | "uploading" | "processing" | "ready" | "failed";

export default function OrgSettingsPage() {
  const t = useTranslations("orgSettings");
  const tCommon = useTranslations("common");

  const { hasRole } = useOrgGuard({ minRole: "admin" });

  const token = useAuthStore((s) => s.token);
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const { fetchCurrentOrg } = useOrg();

  // Photo upload state
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const contactDefaults =
    currentOrg?.contacts.map((c) => ({
      display_name: c.display_name,
      phone: c.phone ?? "",
      email: c.email ?? "",
    })) ?? [{ display_name: "", phone: "", email: "" }];

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ContactsReplaceFormData>({
    resolver: zodResolver(contactsReplaceSchema),
    defaultValues: { contacts: contactDefaults },
  });

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!token || !currentOrg) return;

      try {
        setUploadState("uploading");
        setUploadProgress(0);

        // 1. Request presigned upload URL
        const { media_id, upload_url } = await mediaApi.requestUploadUrl(
          token,
          {
            kind: "photo",
            context: "org_profile",
            filename: file.name,
            content_type: file.type,
            file_size: file.size,
          }
        );

        // 2. XHR PUT with progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.open("PUT", upload_url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        // 3. Confirm upload
        await mediaApi.confirm(token, media_id);
        setUploadState("processing");

        // 4. Poll until ready
        while (true) {
          const statusRes = await mediaApi.status(token, media_id);
          if (statusRes.status === "ready") {
            // 5. Update org photo
            await organizationsApi.updatePhoto(token, currentOrg.id, {
              photo_id: media_id,
            });
            // 6. Refetch org data
            await fetchCurrentOrg(currentOrg.id);
            setUploadState("ready");
            toast.success(tCommon("save"));
            return;
          }
          if (statusRes.status === "failed") {
            setUploadState("failed");
            toast.error(tCommon("error"));
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch {
        setUploadState("failed");
        toast.error(tCommon("error"));
      }
    },
    [token, currentOrg, fetchCurrentOrg, tCommon]
  );

  const onSubmitContacts = async (data: ContactsReplaceFormData) => {
    if (!token || !currentOrg) return;
    try {
      await organizationsApi.replaceContacts(token, currentOrg.id, {
        contacts: data.contacts,
      });
      await fetchCurrentOrg(currentOrg.id);
      reset(data);
      toast.success(t("contacts.saved"));
    } catch {
      toast.error(tCommon("error"));
    }
  };

  if (!hasRole || !currentOrg) {
    return null;
  }

  const registrationDate = currentOrg.registration_date
    ? (() => {
        try {
          return format(new Date(currentOrg.registration_date), "dd.MM.yyyy");
        } catch {
          return currentOrg.registration_date;
        }
      })()
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {/* Card 1: Organization Profile */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Org photo */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("profile.photo")}
            </p>
            <AvatarUpload
              onFileSelected={handleFileSelected}
              currentUrl={currentOrg.photo?.medium_url ?? null}
              uploadState={uploadState}
              uploadProgress={uploadProgress}
            />
          </div>

          {/* Read-only details */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              {t("profile.info")}
            </p>
            <dl className="space-y-3">
              {currentOrg.full_name && (
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-sm text-muted-foreground">
                    {t("profile.fullName")}
                  </dt>
                  <dd className="text-sm font-medium">{currentOrg.full_name}</dd>
                </div>
              )}
              {currentOrg.short_name && (
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-sm text-muted-foreground">
                    {t("profile.shortName")}
                  </dt>
                  <dd className="text-sm font-medium">{currentOrg.short_name}</dd>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <dt className="text-sm text-muted-foreground">
                  {t("profile.inn")}
                </dt>
                <dd className="text-sm font-medium">{currentOrg.inn}</dd>
              </div>
              {currentOrg.legal_address && (
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-sm text-muted-foreground">
                    {t("profile.address")}
                  </dt>
                  <dd className="text-sm font-medium">
                    {currentOrg.legal_address}
                  </dd>
                </div>
              )}
              {currentOrg.manager_name && (
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-sm text-muted-foreground">
                    {t("profile.manager")}
                  </dt>
                  <dd className="text-sm font-medium">
                    {currentOrg.manager_name}
                  </dd>
                </div>
              )}
              {registrationDate && (
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-sm text-muted-foreground">
                    {t("profile.registrationDate")}
                  </dt>
                  <dd className="text-sm font-medium">{registrationDate}</dd>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <dt className="text-sm text-muted-foreground">
                  {t("profile.status")}
                </dt>
                <dd>
                  <Badge
                    variant={
                      currentOrg.status === "verified" ? "default" : "secondary"
                    }
                    className={
                      currentOrg.status === "verified"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                        : undefined
                    }
                  >
                    {currentOrg.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Contacts */}
      <Card>
        <CardHeader>
          <CardTitle>{t("contacts.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitContacts)} className="space-y-4">
            <ContactsEditor
              control={control as unknown as Control<any>}
              errors={errors as FieldErrors<any>}
            />
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="w-full sm:w-auto"
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("contacts.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
