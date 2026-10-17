"use client";

import { PhotoAiEditor } from "@/components/photos/photo-ai-editor";
import { Separator } from "@/components/ui/separator";
import type { Photo } from "@/lib/api";
import { formatBytes } from "@/lib/format-bytes";
import { formatDateTime } from "@/lib/format-date";

const statusLabel: Record<Photo["status"], string> = {
  ACTIVE: "In library",
  ARCHIVE: "Archived",
  TRASH: "In trash",
};

function humanTransform(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function PhotoDetailsPanel({ photo }: { photo: Photo }) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Uploaded", value: formatDateTime(photo.createdAt) },
    {
      label: "Dimensions",
      value: photo.width && photo.height ? `${photo.width} × ${photo.height}` : "Unknown",
    },
    { label: "Size", value: photo.sizeBytes > 0 ? formatBytes(photo.sizeBytes) : "Unknown" },
    { label: "Type", value: photo.mimeType ?? "Image" },
    { label: "Status", value: statusLabel[photo.status] },
  ];

  if (photo.aiTransformType) {
    rows.push({ label: "AI edit", value: humanTransform(photo.aiTransformType) });
  }
  if (photo.deletedAt) {
    rows.push({ label: "Trashed", value: formatDateTime(photo.deletedAt) });
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="details-heading">
        <h3 id="details-heading" className="text-sm font-medium text-foreground">
          Details
        </h3>
        <p className="mt-1 text-sm break-all text-muted-foreground">{photo.fileName}</p>
        <dl className="mt-4 space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right text-foreground tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* The API allows edits on any owned photo; trashed ones are left alone on purpose. */}
      {photo.status !== "TRASH" && (
        <>
          <Separator />
          <div id="ai-editor">
            <PhotoAiEditor key={photo.id} photo={photo} />
          </div>
        </>
      )}
    </div>
  );
}
