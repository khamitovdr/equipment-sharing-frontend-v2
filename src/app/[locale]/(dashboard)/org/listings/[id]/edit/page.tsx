"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrgGuard } from "@/lib/hooks/use-org-guard";
import { listingsApi } from "@/lib/api/listings";
import { ListingForm } from "@/components/org/listing-form";
import { ListingStatusSelect } from "@/components/org/listing-status-select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ListingFormData } from "@/lib/validators/listing";
import type { ListingStatus } from "@/types/listing";

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: listingId } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const orgId = useOrgStore((s) => s.membership?.organization_id);
  const { hasRole } = useOrgGuard({ minRole: "editor" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["org-listing", orgId, listingId],
    queryFn: () => listingsApi.orgGet(token!, orgId!, listingId),
    enabled: !!token && !!orgId && !!listingId && hasRole,
  });

  if (!hasRole || !orgId) return null;

  const handleSubmit = async (data: ListingFormData) => {
    if (!token || !orgId) return;
    setIsSubmitting(true);
    try {
      await listingsApi.orgUpdate(token, orgId, listingId, {
        name: data.name,
        category_id: data.category_id,
        price: data.price,
        description: data.description || undefined,
        specifications: data.specifications,
        with_operator: data.with_operator,
        on_owner_site: data.on_owner_site,
        delivery: data.delivery,
        installation: data.installation,
        setup: data.setup,
        photo_ids: data.photo_ids,
      });
      await queryClient.invalidateQueries({
        queryKey: ["org-listing", orgId, listingId],
      });
      toast.success(t("listingForm.updated"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (status: ListingStatus) => {
    if (!token || !orgId) return;
    setIsChangingStatus(true);
    try {
      await listingsApi.orgUpdateStatus(token, orgId, listingId, { status });
      await queryClient.invalidateQueries({
        queryKey: ["org-listing", orgId, listingId],
      });
      toast.success(t("orgListings.statusChanged"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !orgId) return;
    setIsDeleting(true);
    try {
      await listingsApi.orgDelete(token, orgId, listingId);
      toast.success(t("orgListings.deleted"));
      router.push(`/${locale}/org/listings`);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultValues = listing
    ? {
        name: listing.name,
        category_id: listing.category.id,
        price: listing.price,
        description: listing.description ?? "",
        specifications: listing.specifications ?? undefined,
        with_operator: listing.with_operator,
        on_owner_site: listing.on_owner_site,
        delivery: listing.delivery,
        installation: listing.installation,
        setup: listing.setup,
        photo_ids: listing.photos.map((p) => p.id),
      }
    : undefined;

  const existingPhotos =
    listing?.photos.map((p) => ({
      id: p.id,
      url: p.medium_url || p.small_url || "",
    })) ?? [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      {listing && (
        <div className="flex items-center gap-3">
          <ListingStatusSelect
            currentStatus={listing.status}
            onStatusChange={handleStatusChange}
            disabled={isChangingStatus}
          />
        </div>
      )}

      <ListingForm
        mode="edit"
        defaultValues={defaultValues}
        existingPhotos={existingPhotos}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        orgId={orgId}
      />

      <div className="pt-4 border-t border-border">
        <Button
          variant="destructive"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={isDeleting}
          className="flex items-center gap-2"
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          {t("listingForm.delete")}
        </Button>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("listingForm.delete")}
        description={t("orgListings.deleteConfirm")}
        onConfirm={handleDelete}
      />
    </div>
  );
}
