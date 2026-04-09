import { cn } from "@/lib/utils";

interface OrgPlaceholderProps {
  className?: string;
}

export function OrgPlaceholder({ className }: OrgPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
        className
      )}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-1/2 h-1/2 max-w-[32px] max-h-[32px]"
      >
        {/* Building silhouette */}
        <rect x="10" y="18" width="20" height="34" rx="1" fill="currentColor" opacity="0.5" />
        <rect x="34" y="28" width="20" height="24" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="14" y="24" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="22" y="24" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="14" y="32" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="22" y="32" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="14" y="40" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="22" y="40" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="38" y="34" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="46" y="34" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="38" y="42" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="46" y="42" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="8" y="52" width="48" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
      </svg>
    </div>
  );
}
