import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

export function Footer() {
  const year = new Date().getFullYear();
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand + FASIE */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-bold leading-none">
                E
              </span>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                equip me
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground">
              ООО &laquo;Цифровая платформа совместного использования активов&raquo;
            </p>
            <a
              href="https://fasie.ru/?ysclid=mnnd0kqe1x242687024"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <span className="relative shrink-0">
                <span className="absolute inset-0 hidden dark:block m-auto size-9 rounded-full bg-white/90" />
                <Image
                  src="/partners/fsi.webp"
                  alt="Фонд содействия инновациям"
                  width={28}
                  height={28}
                  className="relative h-7 w-auto object-contain"
                />
              </span>
              <p className="text-[11px] leading-tight text-muted-foreground">
                Проект создан при поддержке<br />
                Фонда содействия инновациям
              </p>
            </a>
          </div>

          {/* Contacts */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Контакты</p>
            <a
              href="tel:+79773776695"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              +7 (977) 377-66-95
            </a>
            <a
              href="mailto:info@equip-me.ru"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              info@equip-me.ru
            </a>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>119234, г. Москва, ул. Ленинские горы, 1</span>
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Реквизиты</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>ООО &laquo;ЦПСИА&raquo;</p>
              <p>ИНН: 7720876531</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          &copy; {year} Equip Me. Все права защищены.
          {" · "}
          <Link href="/user-agreement" className="hover:text-foreground transition-colors">
            {t("userAgreement")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
