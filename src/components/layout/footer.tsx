import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand + FASIE */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded bg-black text-white text-sm font-bold leading-none">
                E
              </span>
              <span className="text-sm font-semibold tracking-tight text-black">
                equip me
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-zinc-500">
              ООО &laquo;Цифровая платформа совместного использования активов&raquo;
            </p>
            <a
              href="https://fasie.ru/?ysclid=mnnd0kqe1x242687024"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Image
                src="/partners/fsi.webp"
                alt="Фонд содействия инновациям"
                width={28}
                height={28}
                className="h-7 w-auto object-contain"
              />
              <p className="text-[11px] leading-tight text-zinc-400">
                Проект создан при поддержке<br />
                Фонда содействия инновациям
              </p>
            </a>
          </div>

          {/* Contacts */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-zinc-900">Контакты</p>
            <a
              href="tel:+79773776695"
              className="flex items-center gap-2 text-sm text-zinc-600 hover:text-black transition-colors"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              +7 (977) 377-66-95
            </a>
            <a
              href="mailto:info@equip-me.ru"
              className="flex items-center gap-2 text-sm text-zinc-600 hover:text-black transition-colors"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              info@equip-me.ru
            </a>
            <div className="flex items-start gap-2 text-sm text-zinc-600">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>119234, г. Москва, ул. Ленинские горы, 1</span>
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-zinc-900">Реквизиты</p>
            <div className="text-sm text-zinc-500 space-y-1">
              <p>ООО &laquo;ЦПСИА&raquo;</p>
              <p>ИНН: 7720876531</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400">
          &copy; {year} Equip Me. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
