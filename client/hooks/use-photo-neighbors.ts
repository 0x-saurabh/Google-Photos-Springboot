"use client";

import { useEffect, useMemo } from "react";
import type { PhotoContext } from "@/components/photos/photo-context";
import { useAlbumPhotos } from "@/hooks/use-albums";
import { usePhotos } from "@/hooks/use-photos";
import type { Photo } from "@/lib/api";

/**
 * Finds the previous and next photo around `photoId` inside the list the
 * viewer was opened from (a library status or an album). Loads the next page
 * automatically when the user reaches the end of what has been fetched.
 */
export function usePhotoNeighbors(photoId: string, context: PhotoContext) {
  const isAlbum = context.kind === "album";
  const status = context.kind === "library" ? context.status : "ACTIVE";

  const library = usePhotos(status, { enabled: !isAlbum });
  const album = useAlbumPhotos(isAlbum ? context.albumId : "");
  const source = isAlbum ? album : library;

  const photos = useMemo<Photo[]>(
    () => source.data?.pages.flatMap((page) => page.content) ?? [],
    [source.data],
  );

  const index = photos.findIndex((photo) => photo.id === photoId);
  const previous = index > 0 ? photos[index - 1] : null;
  const next = index >= 0 && index < photos.length - 1 ? photos[index + 1] : null;
  const nearEnd = index >= 0 && index >= photos.length - 3;

  useEffect(() => {
    if (nearEnd && source.hasNextPage && !source.isFetchingNextPage) {
      source.fetchNextPage();
    }
  }, [nearEnd, source]);

  return {
    previous,
    next,
    index,
    total: source.data?.pages[0]?.totalElements ?? photos.length,
    isLoading: source.isLoading,
  };
}
