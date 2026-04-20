"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgStore } from "@/lib/stores/org-store";
import { useOrgGuard } from "@/lib/hooks/use-org-guard";
import { useApiErrorToast } from "@/lib/hooks/use-api-error-toast";
import { listingsApi } from "@/lib/api/listings";
import { BackButton } from "@/components/shared/back-button";
import { ListingForm } from "@/components/org/listing-form";
import type { ListingFormData } from "@/lib/validators/listing";

export default function CreateListingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const orgId = useOrgStore((s) => s.currentOrg?.id);
  const { hasRole } = useOrgGuard({ minRole: "editor" });
  const toastError = useApiErrorToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!hasRole || !orgId) return null;

  const handleSubmit = async (data: ListingFormData) => {
    if (!token || !orgId) return;
    setIsSubmitting(true);
    try {
      const listing = await listingsApi.orgCreate(token, orgId, {
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
      toast.success(t("listingForm.created"));
      router.push(`/${locale}/org/listings/${listing.id}/edit`);
    } catch (err) {
      toastError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <BackButton />

      <ListingForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        orgId={orgId}
      />
    </div>
  );
}
