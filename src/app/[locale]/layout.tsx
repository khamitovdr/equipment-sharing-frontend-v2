import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n/routing";
import { QueryProvider } from "@/lib/query/providers";
import { NavigationTracker } from "@/components/shared/navigation-tracker";
import { Toaster } from "sonner";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "ru" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <QueryProvider>
        <NavigationTracker />
        {children}
        <Toaster position="top-right" />
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
