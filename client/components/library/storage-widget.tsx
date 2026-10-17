"use client";

import { HardDrive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStorageUsage } from "@/hooks/use-library";
import { formatBytes } from "@/lib/format-bytes";
import { cn } from "@/lib/utils";

type StorageWidgetProps = {
  className?: string;
};

/**
 * Shows real library usage from the backend. There is no quota in the API,
 * so no percentage bar is drawn.
 */
export function StorageWidget({ className }: StorageWidgetProps) {
  const { data, isLoading, isError } = useStorageUsage();

  if (isLoading) {
    return <Skeleton className={cn("h-[4.25rem] rounded-lg", className)} />;
  }

  if (isError || !data) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-sidebar-border bg-background/60 px-3 py-2.5 text-xs",
        className,
      )}
    >
      <div className="flex items-center gap-2 font-medium text-sidebar-foreground">
        <HardDrive className="size-3.5 text-muted-foreground" aria-hidden="true" />
        Library
      </div>
      <dl className="mt-1.5 grid grid-cols-2 gap-x-3 text-muted-foreground">
        <div>
          <dt className="sr-only">Photos</dt>
          <dd>
            <span className="font-medium text-sidebar-foreground tabular-nums">
              {data.libraryPhotoCount}
            </span>{" "}
            {data.libraryPhotoCount === 1 ? "photo" : "photos"}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Storage used</dt>
          <dd>
            <span className="font-medium text-sidebar-foreground tabular-nums">
              {formatBytes(data.libraryUsedBytes)}
            </span>{" "}
            used
          </dd>
        </div>
      </dl>
    </div>
  );
}
