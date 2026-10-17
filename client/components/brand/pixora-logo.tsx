import { cn } from "@/lib/utils";

type PixoraMarkProps = React.ComponentProps<"svg">;

/**
 * Pixora mark: a 2x2 pixel grid where one cell becomes a lens.
 * Uses currentColor so it inherits the surrounding text color.
 */
export function PixoraMark({ className, ...props }: PixoraMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-6 shrink-0", className)}
      {...props}
    >
      <rect x="3" y="3" width="11" height="11" rx="3.25" />
      <rect x="18" y="3" width="11" height="11" rx="3.25" />
      <rect x="3" y="18" width="11" height="11" rx="3.25" />
      <circle cx="23.5" cy="23.5" r="5.75" />
    </svg>
  );
}

type PixoraLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

/** Mark plus wordmark, used in navigation and the auth pages. */
export function PixoraLogo({ className, markClassName, wordmarkClassName }: PixoraLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <PixoraMark className={cn("text-primary", markClassName)} />
      <span
        className={cn(
          "text-[15px] font-semibold tracking-[-0.02em] text-foreground",
          wordmarkClassName,
        )}
      >
        Pixora
      </span>
    </span>
  );
}
