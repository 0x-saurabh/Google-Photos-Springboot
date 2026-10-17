"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { photoHref, type PhotoContext } from "@/components/photos/photo-context";
import { PhotoTileMenu, type PhotoTileMenuHandlers } from "@/components/photos/photo-tile-menu";
import type { Photo } from "@/lib/api";
import { photoThumbnailSrc } from "@/lib/imagekit";
import { cn } from "@/lib/utils";

type PhotoTileProps = {
  photo: Photo;
  context: PhotoContext;
  selectable: boolean;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggle: (photo: Photo, shiftKey: boolean) => void;
  handlers: PhotoTileMenuHandlers;
  priority?: boolean;
};

export function PhotoTile({
  photo,
  context,
  selectable,
  isSelectMode,
  isSelected,
  onToggle,
  handlers,
  priority,
}: PhotoTileProps) {
  const isCover = context.kind === "album" && context.coverPhotoId === photo.id;
  const href = photoHref(photo.id, context);

  const image = (
    <Image
      src={photoThumbnailSrc(photo)}
      alt={photo.fileName}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 20vw, 16vw"
      className={cn(
        "object-cover transition-transform duration-500 ease-out",
        isSelected ? "scale-[0.88]" : "group-hover:scale-[1.03]",
      )}
      unoptimized
      priority={priority}
    />
  );

  return (
    <article
      className={cn(
        "photo-tile group relative aspect-square overflow-hidden rounded-lg bg-muted transition-[box-shadow,background-color] duration-200",
        isSelected && "bg-accent ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
      data-selected={isSelected || undefined}
    >
      {isSelectMode && selectable ? (
        <button
          type="button"
          aria-pressed={isSelected}
          aria-label={`${isSelected ? "Deselect" : "Select"} ${photo.fileName}`}
          onClick={(event) => onToggle(photo, event.shiftKey)}
          className={cn(
            "absolute inset-0 block overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isSelected && "rounded-md",
          )}
        >
          {image}
        </button>
      ) : (
        <Link
          href={href}
          aria-label={`Open ${photo.fileName}`}
          className="absolute inset-0 block overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {image}
        </Link>
      )}

      {/* Hover overlay with file name. Pointer-events are off so it never blocks clicks. */}
      <div
        className={cn(
          "overlay-bottom pointer-events-none absolute inset-x-0 bottom-0 px-2.5 pt-8 pb-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100",
          isSelectMode && "hidden",
        )}
        aria-hidden="true"
      >
        <p className="truncate text-[11px] font-medium text-white/95">{photo.fileName}</p>
      </div>

      {selectable && (
        <button
          type="button"
          aria-label={`${isSelected ? "Deselect" : "Select"} ${photo.fileName}`}
          aria-pressed={isSelected}
          onClick={(event) => {
            event.preventDefault();
            onToggle(photo, event.shiftKey);
          }}
          className={cn(
            "absolute top-2 left-2 z-10 flex size-6 items-center justify-center rounded-full border transition-[opacity,transform,background-color] duration-150 outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring",
            isSelected
              ? "border-primary bg-primary text-primary-foreground opacity-100"
              : "border-white/70 bg-black/35 text-white opacity-0 backdrop-blur-sm group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-black/55",
            isSelectMode && "opacity-100",
          )}
        >
          <Check className={cn("size-3.5", !isSelected && "opacity-0")} strokeWidth={3} />
        </button>
      )}

      {isCover && (
        <span
          className="pointer-events-none absolute right-2 bottom-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
          aria-label="Album cover"
        >
          <Star className="size-3" />
          Cover
        </span>
      )}

      {!isSelectMode && (
        <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 has-data-popup-open:opacity-100">
          <PhotoTileMenu photo={photo} context={context} handlers={handlers} />
        </div>
      )}
    </article>
  );
}

export function PhotoTileSkeleton() {
  return <div className="aspect-square animate-pulse rounded-lg bg-muted" aria-hidden="true" />;
}
