import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { listingsApi } from "@/lib/api/listings";
import { organizationsApi } from "@/lib/api/organizations";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { ListingCard } from "@/components/catalog/listing-card";
import type { ListingRead } from "@/types/listing";
import type { OrganizationListRead } from "@/types/organization";

export default async function HomePage() {
  const t = await getTranslations();

  let listings: ListingRead[] = [];
  let organizations: OrganizationListRead[] = [];

  try {
    const [listingsRes, orgsRes] = await Promise.all([
      listingsApi.list({ limit: 10 }),
      organizationsApi.list({ limit: 6 }),
    ]);
    listings = listingsRes.items;
    organizations = orgsRes.items;
  } catch {
    // Render with empty data rather than crashing
  }

  return (
    <div className="flex flex-col">
      {/* ── 1. Hero ─────────────────────────────────────────── */}
      <section className="border-b bg-zinc-50 py-20 sm:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("home.hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("home.hero.subtitle")}
          </p>
          <div className="mt-8">
            <Link href="/listings" className={cn(buttonVariants({ size: "lg" }))}>
              {t("home.hero.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Latest listings ──────────────────────────────── */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("home.latestListings")}
            </h2>
            <Link
              href="/listings"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("nav.catalog")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t("common.comingSoon")}</p>
          )}
        </div>
      </section>

      {/* ── 3. Top organizations ─────────────────────────────── */}
      <section className="bg-zinc-50 py-14">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            {t("home.topOrganizations")}
          </h2>

          {organizations.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {organizations.map((org) => {
                const displayName = org.short_name ?? org.full_name ?? org.inn;
                const initial = displayName.charAt(0).toUpperCase();

                return (
                  <Link
                    key={org.id}
                    href={`/organizations/${org.id}`}
                    className="group flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-colors hover:bg-white hover:shadow-sm"
                  >
                    {/* Avatar */}
                    <div className="relative h-14 w-14 overflow-hidden rounded-full bg-zinc-200">
                      {org.photo?.small_url ? (
                        <Image
                          src={org.photo.small_url}
                          alt={displayName}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-zinc-600">
                          {initial}
                        </span>
                      )}
                    </div>
                    {/* Name */}
                    <span className="line-clamp-2 text-xs font-medium leading-tight">
                      {displayName}
                    </span>
                    {/* Listing count */}
                    <span className="text-xs text-muted-foreground">
                      {org.published_listing_count}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">{t("common.comingSoon")}</p>
          )}
        </div>
      </section>

      {/* ── 4. Partners ──────────────────────────────────────── */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
            {t("home.partners")}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex h-12 w-32 items-center justify-center rounded-lg bg-zinc-100 grayscale"
                aria-label={`Partner ${i + 1}`}
              >
                <span className="text-sm font-semibold text-zinc-400">
                  Partner {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CTA banners ───────────────────────────────────── */}
      <section className="bg-zinc-50 py-14">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Rent CTA */}
            <Card className="p-6">
              <CardContent className="p-0">
                <h3 className="text-lg font-bold">{t("home.ctaRent")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("home.ctaRentDesc")}
                </p>
              </CardContent>
              <CardFooter className="mt-4 border-0 bg-transparent p-0">
                <Link href="/organizations/new" className={cn(buttonVariants({ variant: "default" }))}>
                  {t("nav.createOrg")}
                </Link>
              </CardFooter>
            </Card>

            {/* Search CTA */}
            <Card className="p-6">
              <CardContent className="p-0">
                <h3 className="text-lg font-bold">{t("home.ctaSearch")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("home.ctaSearchDesc")}
                </p>
              </CardContent>
              <CardFooter className="mt-4 border-0 bg-transparent p-0">
                <Link href="/listings" className={cn(buttonVariants({ variant: "outline" }))}>
                  {t("nav.catalog")}
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
