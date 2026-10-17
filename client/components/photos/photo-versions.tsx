"use client";

import Image from "next/image";
import Link from "next/link";
import { GitBranch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePhotoVersions } from "@/hooks/use-edit";
import type { Photo } from "@/lib/api";
import { formatRelative } from "@/lib/format-date";
import { photoThumbnailSrc } from "@/lib/imagekit";

function humanTransform(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function VersionRow({ photo, label }: { photo: Photo; label: string }) {
  return (
    <li>
      <Link
        href={`/photos/${photo.id}`}
        className="flex items-center gap-3 rounded-lg p-1.5 -m-1.5 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image src={photoThumbnailSrc(photo, 120)} alt="" fill sizes="44px" className="object-cover" unoptimized />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-foreground">{label}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {photo.fileName} · {formatRelative(photo.createdAt)}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Lineage of a photo: what it was derived from and what has been derived from it. */
export function PhotoVersions({ photo }: { photo: Photo }) {
  const { data, isLoading } = usePhotoVersions(photo.id);

  if (isLoading) {
    return <Skeleton className="h-16 rounded-lg" />;
  }
  if (!data || (!data.parent && data.derived.length === 0)) {
    return null;
  }

  return (
    <section aria-labelledby="versions-heading" className="space-y-3">
      <h3 id="versions-heading" className="flex items-center gap-2 text-sm font-medium text-foreground">
        <GitBranch className="size-4 text-muted-foreground" aria-hidden="true" />
        Versions
      </h3>
      {data.parent && (
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Derived from</p>
          <ul>
            <VersionRow photo={data.parent} label="Original" />
          </ul>
        </div>
      )}
      {data.derived.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">
            {data.derived.length === 1 ? "1 edit saved from this photo" : `${data.derived.length} edits saved from this photo`}
          </p>
          <ul className="space-y-1">
            {data.derived.map((version) => (
              <VersionRow
                key={version.id}
                photo={version}
                label={version.aiTransformType ? humanTransform(version.aiTransformType) : "Edited copy"}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
