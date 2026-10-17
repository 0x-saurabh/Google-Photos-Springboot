"use client";

import Link from "next/link";
import { Lock, LockOpen } from "lucide-react";
import { AlbumCoverImage } from "@/components/albums/album-cover-image";
import type { Album } from "@/lib/api";
import { formatRelative } from "@/lib/format-date";
import { cn } from "@/lib/utils";

type AlbumGridProps = {
  albums: Album[];
  isLoading?: boolean;
  className?: string;
};

const gridClass = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function AlbumCard({ album }: { album: Album }) {
  return (
    <Link
      href={`/albums/${album.id}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted shadow-photo transition-shadow duration-200 group-hover:shadow-float">
        {album.locked && !album.unlocked ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-muted to-muted/60 text-muted-foreground">
            <Lock className="size-7 opacity-70" aria-hidden="true" />
            <span className="text-[11px]">Locked</span>
          </div>
        ) : (
          <AlbumCoverImage
            src={album.coverThumbnailUrl}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        )}
        {album.locked && (
          <span
            className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur"
            title={album.unlocked ? "Private album, unlocked" : "Private album"}
          >
            {album.unlocked ? <LockOpen className="size-3.5" aria-hidden="true" /> : <Lock className="size-3.5" aria-hidden="true" />}
            <span className="sr-only">{album.unlocked ? "Private, unlocked" : "Private"}</span>
          </span>
        )}
      </div>
      <div className="mt-2.5 px-0.5">
        <h3 className="truncate text-sm font-medium text-foreground">{album.title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, updated </span>
          {formatRelative(album.updatedAt)}
        </p>
      </div>
    </Link>
  );
}

export function AlbumGrid({ albums, isLoading, className }: AlbumGridProps) {
  if (isLoading) {
    return (
      <div className={cn(gridClass, className)} aria-busy="true" aria-label="Loading albums">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} aria-hidden="true">
            <div className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
            <div className="mt-2.5 h-3.5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mt-1.5 h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(gridClass, className)}>
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
}
