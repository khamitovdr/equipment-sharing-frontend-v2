import Link from "next/link";
import { useTranslations } from "next-intl";
import { BackButton } from "@/components/shared/back-button";

const PDF_URL = "/user-agreement.pdf";

export default function UserAgreementPage() {
  const t = useTranslations("userAgreement");

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-2 sm:px-6">
        <BackButton />
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-bold leading-none">
            E
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            equip me
          </span>
        </Link>
      </header>
      <div className="flex-1 overflow-hidden">
        <object data={PDF_URL} type="application/pdf" className="h-full w-full">
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            <p>
              {t("fallback")}{" "}
              <a href={PDF_URL} download className="font-medium text-foreground underline">
                {t("download")}
              </a>
            </p>
          </div>
        </object>
      </div>
    </div>
  );
}
