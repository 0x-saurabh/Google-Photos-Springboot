"use client";

import { HardDrive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStorageUsage } from "@/hooks/use-library";
import { formatBytes } from "@/lib/format-bytes";

/** Real numbers from the backend only. No quota or usage history is invented. */
export function LibrarySummary() {
  const { data, isLoading, isError } = useStorageUsage();

  if (isLoading) {
    return <Skeleton className="h-28 rounded-xl" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
        Storage details are unavailable right now.
      </div>
    );
  }

  const stats: Array<{ label: string; value: string }> = [
    { label: "Photos in library", value: data.libraryPhotoCount.toLocaleString() },
    { label: "Library size", value: formatBytes(data.libraryUsedBytes) },
  ];
  if (data.imagekitStorageBytes !== null) {
    stats.push({ label: "ImageKit storage", value: formatBytes(data.imagekitStorageBytes) });
  }
  if (data.imagekitBandwidthBytes !== null) {
    stats.push({ label: "ImageKit bandwidth", value: formatBytes(data.imagekitBandwidthBytes) });
  }

  return (
    <section aria-labelledby="library-summary-heading" className="rounded-xl border border-border bg-card p-5">
      <h2 id="library-summary-heading" className="flex items-center gap-2 text-sm font-medium text-foreground">
        <HardDrive className="size-4 text-muted-foreground" aria-hidden="true" />
        Library
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dd className="font-display text-2xl text-foreground tabular-nums">{stat.value}</dd>
            <dt className="mt-0.5 text-xs text-muted-foreground">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
