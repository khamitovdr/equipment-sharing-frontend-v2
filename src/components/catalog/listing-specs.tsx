import { getTranslations } from "next-intl/server";

interface ListingSpecsProps {
  specifications: Record<string, string> | null;
}

export async function ListingSpecs({ specifications }: ListingSpecsProps) {
  if (!specifications || Object.keys(specifications).length === 0) {
    return null;
  }

  const t = await getTranslations();

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{t("listing.specifications")}</h2>
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(specifications).map(([key, value]) => (
            <tr key={key} className="border-b last:border-0">
              <td className="py-2 pr-4 text-zinc-500">{key}</td>
              <td className="py-2 font-medium">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
