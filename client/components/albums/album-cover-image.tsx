"use client";

import { useState } from "react";
import Image from "next/image";
import { FolderOpen } from "lucide-react";
import { albumCoverSrc } from "@/lib/imagekit";
import { cn } from "@/lib/utils";

type AlbumCoverImageProps = {
  src: string | null;
  sizes: string;
  size?: number;
  className?: string;
  /** Shown when there is no cover or the file can no longer be loaded. */
  placeholderLabel?: string;
};

/**
 * Album cover with a graceful fallback. A cover can stop loading if the
 * underlying file was removed from ImageKit while the album still points at it.
 */
export function AlbumCoverImage({
  src,
  sizes,
  size = 800,
  className,
  placeholderLabel = "No cover yet",
}: AlbumCoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
        <FolderOpen className="size-7 opacity-60" aria-hidden="true" />
        <span className="text-[11px]">{failed ? "Cover unavailable" : placeholderLabel}</span>
      </div>
    );
  }

  return (
    <Image
      src={albumCoverSrc(src, size)}
      alt=""
      fill
      sizes={sizes}
      className={cn("object-cover", className)}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
