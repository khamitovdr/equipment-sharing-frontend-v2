import { cn } from "@/lib/utils";

interface EquipmentPlaceholderProps {
  className?: string;
}

export function EquipmentPlaceholder({ className }: EquipmentPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted text-muted-foreground",
        className
      )}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-1/2 h-1/2 max-w-[48px] max-h-[48px]"
      >
        {/* Excavator / heavy equipment silhouette */}
        <rect x="8" y="44" width="48" height="8" rx="4" fill="currentColor" />
        <circle cx="18" cy="52" r="5" fill="currentColor" opacity="0.6" />
        <circle cx="46" cy="52" r="5" fill="currentColor" opacity="0.6" />
        <rect x="12" y="28" width="24" height="16" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="14" y="30" width="10" height="8" rx="1" fill="currentColor" opacity="0.3" />
        <path
          d="M36 28 L36 14 L54 14 L54 28"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
        <rect x="38" y="14" width="14" height="6" rx="1" fill="currentColor" opacity="0.4" />
      </svg>
    </div>
  );
}
