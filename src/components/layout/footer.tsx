import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded bg-black text-white text-xs font-bold leading-none">
            E
          </span>
          <span className="text-sm font-semibold tracking-tight text-black">
            equip me
          </span>
        </Link>
        <p className="text-xs text-zinc-400">© {year} Equip Me</p>
      </div>
    </footer>
  );
}
