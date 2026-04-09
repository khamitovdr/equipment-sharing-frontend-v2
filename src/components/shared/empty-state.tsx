import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  message: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function EmptyState({ message, ctaLabel, onCtaClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      {ctaLabel && onCtaClick && (
        <Button variant="outline" onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
