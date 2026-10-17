"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import { AlbumCard } from "@/components/albums/album-grid";
import { CreateAlbumDialog } from "@/components/albums/create-album-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlbums } from "@/hooks/use-albums";

const LIMIT = 5;

export function RecentAlbums() {
  const { data: albums = [], isLoading, isError } = useAlbums();
  const recent = useMemo(
    () =>
      [...albums]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, LIMIT),
    [albums],
  );

  return (
    <section aria-labelledby="recent-albums-heading" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="recent-albums-heading" className="text-base font-medium text-foreground">
            Albums
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {albums.length > 0
              ? `${albums.length} ${albums.length === 1 ? "album" : "albums"}, most recently updated first`
              : "Group photos by trip, event or theme"}
          </p>
        </div>
        {albums.length > 0 && (
          <Link href="/albums" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            All albums
            <ArrowRight data-icon="inline-end" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: LIMIT }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Albums are unavailable right now.</p>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <FolderOpen className="size-4" aria-hidden="true" />
            </span>
            <p className="text-sm text-muted-foreground">You haven&apos;t created any albums yet.</p>
          </div>
          <CreateAlbumDialog variant="outline" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {recent.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </section>
  );
}
