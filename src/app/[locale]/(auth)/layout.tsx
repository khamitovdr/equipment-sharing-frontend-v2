export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-black text-white text-sm font-bold">
            E
          </div>
          <span className="text-lg font-semibold tracking-tight">equip me</span>
        </div>

        {children}
      </div>
    </div>
  );
}
