"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { X } from "lucide-react";

import { orgCreateSchema, type OrgCreateFormData } from "@/lib/validators/organization";
import { organizationsApi } from "@/lib/api/organizations";
import { usersApi } from "@/lib/api/users";
import { mediaApi } from "@/lib/api/media";
import { ApiRequestError } from "@/lib/api/client";
import { useApiErrorToast } from "@/lib/hooks/use-api-error-toast";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { DadataSuggest } from "@/components/org/dadata-suggest";
import { ContactsEditor } from "@/components/org/contacts-editor";
import { AvatarUpload } from "@/components/media/avatar-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DadataSuggestion } from "@/types/dadata";

type UploadState = "idle" | "uploading" | "processing" | "ready" | "failed";

export default function OrgCreatePage() {
  const t = useTranslations("orgCreate");
  const locale = useLocale();
  const router = useRouter();
  const { token } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { setOrganizations, switchOrg } = useOrgStore();
  const toastError = useApiErrorToast();

  const [hydrated, setHydrated] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DadataSuggestion | null>(null);
  const [photoMediaId, setPhotoMediaId] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace(`/${locale}/login`);
    }
  }, [hydrated, isAuthenticated, locale, router]);

  const form = useForm<OrgCreateFormData>({
    resolver: zodResolver(orgCreateSchema),
    defaultValues: { inn: "", contacts: [{ display_name: "", phone: "", email: "" }] },
  });

  const handleSuggestionSelect = useCallback(
    (suggestion: DadataSuggestion) => {
      setSelectedSuggestion(suggestion);
      form.setValue("inn", suggestion.data.inn, { shouldValidate: true });
    },
    [form]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedSuggestion(null);
    form.setValue("inn", "", { shouldValidate: false });
  }, [form]);

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!token) return;
      try {
        setUploadState("uploading");
        setUploadProgress(0);

        const { media_id, upload_url } = await mediaApi.requestUploadUrl(token, {
          kind: "photo",
          context: "org_profile",
          filename: file.name,
          content_type: file.type,
          file_size: file.size,
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          });
          xhr.addEventListener("load", () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error("Upload failed"))
          );
          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.open("PUT", upload_url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        await mediaApi.confirm(token, media_id);
        setUploadState("processing");

        while (true) {
          const statusResp = await mediaApi.status(token, media_id);
          if (statusResp.status === "ready") {
            setPhotoMediaId(media_id);
            setUploadState("ready");
            return;
          }
          if (statusResp.status === "failed") {
            setUploadState("failed");
            toast.error(t("error.innRequired"));
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch {
        setUploadState("failed");
        toast.error(t("error.innRequired"));
      }
    },
    [token, t]
  );

  const onSubmit = async (data: OrgCreateFormData) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const org = await organizationsApi.create(token, {
        inn: data.inn,
        contacts: data.contacts.map((c) => ({
          display_name: c.display_name,
          phone: c.phone || null,
          email: c.email || null,
        })),
      });

      if (photoMediaId) {
        await organizationsApi.updatePhoto(token, org.id, { photo_id: photoMediaId });
      }

      const res = await usersApi.myOrganizations(token);
      setOrganizations(res.items);
      switchOrg(org.id);

      toast.success(t("success"));
      router.push(`/${locale}/org/listings`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        toast.error(t("error.alreadyExists"));
      } else {
        toastError(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hydrated || !isAuthenticated) return null;

  const d = selectedSuggestion?.data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: INN / Name Search */}
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="text-base">{t("search.label")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DadataSuggest
              onSelect={handleSuggestionSelect}
              disabled={!!selectedSuggestion || isSubmitting}
            />

            {form.formState.errors.inn && (
              <p className="text-xs text-destructive">
                {t("error.innRequired")}
              </p>
            )}

            {selectedSuggestion && d && (
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p>
                      <span className="text-muted-foreground">{t("details.fullName")}:</span>{" "}
                      <span className="font-medium">{d.name.full_with_opf}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">{t("details.shortName")}:</span>{" "}
                      {d.name.short_with_opf}
                    </p>
                    <p>
                      <span className="text-muted-foreground">{t("details.inn")}:</span>{" "}
                      {d.inn}
                    </p>
                    {d.address?.value && (
                      <p>
                        <span className="text-muted-foreground">{t("details.address")}:</span>{" "}
                        {d.address.value}
                      </p>
                    )}
                    {d.management?.name && (
                      <p>
                        <span className="text-muted-foreground">{t("details.manager")}:</span>{" "}
                        {d.management.name}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="shrink-0"
                    aria-label="Clear selection"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Org Photo (optional) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("photo.label")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <AvatarUpload
              onFileSelected={handleFileSelected}
              uploadState={uploadState}
              uploadProgress={uploadProgress}
            />
          </CardContent>
        </Card>

        {/* Section 3: Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("contacts.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactsEditor
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              control={form.control as any}
              errors={form.formState.errors}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || uploadState === "uploading" || uploadState === "processing"}
        >
          {t("submit")}
        </Button>
      </form>
    </div>
  );
}
