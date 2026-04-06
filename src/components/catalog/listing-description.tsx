import { getTranslations } from "next-intl/server";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

interface ListingDescriptionProps {
  description: string | null;
}

export async function ListingDescription({ description }: ListingDescriptionProps) {
  if (!description) {
    return null;
  }

  const t = await getTranslations();

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{t("listing.description")}</h2>
      <div className="prose prose-sm prose-zinc max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{description}</ReactMarkdown>
      </div>
    </section>
  );
}
