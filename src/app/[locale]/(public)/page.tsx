import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { listingsApi } from "@/lib/api/listings";
import { organizationsApi } from "@/lib/api/organizations";

import { buttonVariants } from "@/components/ui/button-variants";
import { OrgPlaceholder } from "@/components/shared/org-placeholder";
import { cn } from "@/lib/utils";
import { ListingCard } from "@/components/catalog/listing-card";
import { ListingRow } from "@/components/catalog/listing-row";
import { ScrollHero } from "@/components/layout/scroll-hero";
import type { ListingRead } from "@/types/listing";
import type { OrganizationListRead } from "@/types/organization";

export default async function HomePage() {
  const t = await getTranslations();

  let listings: ListingRead[] = [];
  let organizations: OrganizationListRead[] = [];

  try {
    const [listingsRes, orgsRes] = await Promise.all([
      listingsApi.list({ limit: 12 }),
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
      <ScrollHero />

      {/* ── 2. Latest listings ──────────────────────────────── */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            {t("home.latestListings")}
          </h2>

          {listings.length > 0 ? (
            <div className="relative pb-12">
              {/* Mobile: compact rows */}
              <div className="flex flex-col gap-2 sm:hidden">
                {listings.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </div>
              {/* Tablet+: card grid */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Gradient fade over last row + CTA */}
              <div className="pointer-events-none absolute -inset-x-4 bottom-0 flex h-80 items-end justify-center bg-gradient-to-t from-background from-30% via-background/90 via-60% to-transparent pb-2">
                <Link
                  href="/listings"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "pointer-events-auto gap-2 border-border bg-background shadow-sm"
                  )}
                >
                  {t("home.exploreCatalog")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">{t("common.comingSoon")}</p>
          )}
        </div>
      </section>

      {/* ── 3. Top organizations ─────────────────────────────── */}
      <section className="bg-muted/50 py-14">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            {t("home.topOrganizations")}
          </h2>

          {organizations.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => {
                const displayName = org.short_name ?? org.full_name ?? org.inn;
                const initial = displayName.charAt(0).toUpperCase();

                return (
                  <Link
                    key={org.id}
                    href={`/organizations/${org.id}`}
                    className="flex items-center gap-4 rounded-xl border bg-background p-4 transition-all hover:shadow-md"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                      {org.photo?.small_url ? (
                        <Image
                          src={org.photo.small_url}
                          alt={displayName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <OrgPlaceholder className="h-full w-full" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{displayName}</p>
                      {org.published_listing_count > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("org.listingCount", { count: org.published_listing_count })}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
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
      <section className="border-t py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-2xl font-bold tracking-tight">
            {t("home.partners")}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-14 sm:gap-20">
            {[
              { src: "/partners/fsi.webp", href: "https://fasie.ru/?ysclid=mnnd0kqe1x242687024", alt: "Фонд содействия инновациям" },
              { src: "/partners/intc.webp", href: "https://i.moscow/innovacionnyy-nauchno-tehnologicheskiy-centr-mgu-vorobevy-gory", alt: "ИНТЦ МГУ Воробьёвы горы" },
              { src: "/partners/ef.webp", href: "https://www.econ.msu.ru/?ysclid=mnnd05ppbg247590508", alt: "Экономический факультет МГУ" },
            ].map((partner) => (
              <a
                key={partner.src}
                href={partner.href}
                target="_blank"
                rel="noopener noreferrer"
                className="grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100 dark:grayscale-0 dark:opacity-100"
              >
                <Image
                  src={partner.src}
                  alt={partner.alt}
                  width={240}
                  height={80}
                  className="h-16 w-auto object-contain sm:h-20 dark:[filter:drop-shadow(1px_0_0_white)_drop-shadow(-1px_0_0_white)_drop-shadow(0_1px_0_white)_drop-shadow(0_-1px_0_white)]"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CTA banners ───────────────────────────────────── */}
      <section className="bg-muted/50 py-14">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Rent CTA */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-lg font-bold">{t("home.ctaRent")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("home.ctaRentDesc")}
              </p>
              <Link href="/organizations/new" className={cn(buttonVariants({ variant: "default" }), "mt-4")}>
                {t("nav.createOrg")}
              </Link>
            </div>

            {/* Search CTA */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-lg font-bold">{t("home.ctaSearch")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("home.ctaSearchDesc")}
              </p>
              <Link href="/listings" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
                {t("nav.catalog")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
