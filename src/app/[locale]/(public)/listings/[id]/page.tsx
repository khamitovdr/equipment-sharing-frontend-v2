import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Settings, Truck, User, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { listingsApi } from "@/lib/api/listings";
import { organizationsApi } from "@/lib/api/organizations";
import { ListingDescription } from "@/components/catalog/listing-description";
import { ListingSpecs } from "@/components/catalog/listing-specs";
import { MediaCarousel } from "@/components/catalog/media-carousel";
import { OrderForm } from "@/components/catalog/order-form";
import { formatCost } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations();

  let listing;
  try {
    listing = await listingsApi.get(id);
  } catch {
    notFound();
  }

  let organization = null;
  try {
    organization = await organizationsApi.get(listing.organization_id);
  } catch {
    // optional — don't fail page
  }

  const serviceFlags = [
    { key: "delivery", label: t("catalog.delivery"), enabled: listing.delivery, icon: Truck },
    { key: "with_operator", label: t("catalog.withOperator"), enabled: listing.with_operator, icon: User },
    { key: "on_owner_site", label: t("catalog.onOwnerSite"), enabled: listing.on_owner_site, icon: MapPin },
    { key: "installation", label: t("catalog.installation"), enabled: listing.installation, icon: Wrench },
    { key: "setup", label: t("catalog.setup"), enabled: listing.setup, icon: Settings },
  ].filter((f) => f.enabled);

  const orgDisplayName = organization?.short_name ?? organization?.full_name ?? null;
  const orgInitial = orgDisplayName ? orgDisplayName.charAt(0).toUpperCase() : "O";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Left column (~60%) */}
        <div className="flex flex-col gap-8 lg:w-[60%]">
          <MediaCarousel photos={listing.photos} videos={listing.videos} />

          <ListingDescription description={listing.description} />

          <ListingSpecs specifications={listing.specifications} />
        </div>

        {/* Right column (~40%) sticky on desktop */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:w-[40%]">
          {/* Price */}
          <div>
            <span className="text-xs text-zinc-500">{listing.category.name}</span>
            <h1 className="mt-1 text-xl font-bold leading-tight">{listing.name}</h1>
            <p className="mt-2 text-2xl font-bold">
              {formatCost(listing.price)}{" "}
              <span className="text-base font-normal text-zinc-500">
                {t("catalog.perDay")}
              </span>
            </p>
          </div>

          {/* Service flags */}
          {serviceFlags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {serviceFlags.map((flag) => (
                <Badge key={flag.key} variant="secondary" className="gap-1.5 px-2.5 py-1">
                  <flag.icon className="h-3 w-3" />
                  {flag.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Order form */}
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <OrderForm listingId={listing.id} pricePerDay={listing.price} />
          </div>

          {/* Org info card */}
          {organization && orgDisplayName && (
            <Link
              href={`/organizations/${organization.id}`}
              className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              {organization.photo ? (
                <img
                  src={organization.photo.small_url}
                  alt={orgDisplayName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600">
                  {orgInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{orgDisplayName}</p>
                {organization.status === "verified" && (
                  <p className="text-xs text-zinc-500">{t("org.verified")}</p>
                )}
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
