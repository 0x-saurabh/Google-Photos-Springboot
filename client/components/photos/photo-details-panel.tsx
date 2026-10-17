"use client";

import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { PhotoAiEditor } from "@/components/photos/photo-ai-editor";
import { PhotoVersions } from "@/components/photos/photo-versions";
import { buttonVariants } from "@/components/ui/button";
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

type PhotoDetailsPanelProps = {
  photo: Photo;
  /** Link to the full editor, carrying the list context so "Back" returns here. */
  editHref?: string;
};

export function PhotoDetailsPanel({ photo, editHref }: PhotoDetailsPanelProps) {
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
  if (photo.editChain) {
    rows.push({
      label: "Edit chain",
      value: <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] break-all">{photo.editChain}</code>,
    });
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

      <PhotoVersions photo={photo} />

      {/* The API allows edits on any owned photo; trashed ones are left alone on purpose. */}
      {photo.status !== "TRASH" && (
        <>
          <Separator />
          {editHref && (
            <section aria-labelledby="editor-cta-heading" className="rounded-xl border border-border bg-card p-4">
              <h3 id="editor-cta-heading" className="text-sm font-medium text-foreground">
                Editor
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Crop, resize, rotate, add effects and chain AI steps with a before/after preview. Results are saved as new photos.
              </p>
              <Link href={editHref} className={buttonVariants({ size: "sm", className: "mt-3 w-full" })}>
                <SlidersHorizontal />
                Open editor
              </Link>
            </section>
          )}
          <div id="ai-editor">
            <PhotoAiEditor key={photo.id} photo={photo} />
          </div>
        </>
      )}
    </div>
  );
}
