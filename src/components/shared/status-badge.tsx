import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function StatusBadge({
  status,
  variant = "secondary",
  className,
}: StatusBadgeProps) {
  return (
    <Badge variant={variant} className={cn(className)}>
      {status}
    </Badge>
  );
}
