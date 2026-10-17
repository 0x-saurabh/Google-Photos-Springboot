"use client";

import { useCallback, useMemo, useState } from "react";
import { AddToAlbumDialog } from "@/components/albums/add-to-album-dialog";
import type { PhotoContext } from "@/components/photos/photo-context";
import { PhotoTile, PhotoTileSkeleton } from "@/components/photos/photo-tile";
import type { PhotoTileMenuHandlers } from "@/components/photos/photo-tile-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRemovePhotoFromAlbum, useUpdateAlbum } from "@/hooks/use-albums";
import {
  useArchivePhotos,
  usePermanentlyDeletePhotos,
  useRestorePhotos,
  useTrashPhotos,
} from "@/hooks/use-photos";
import type { Photo } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePhotoSelectionStore } from "@/stores/photo-selection-store";

type PhotoGridProps = {
  photos: Photo[];
  context: PhotoContext;
  isLoading?: boolean;
  selectable?: boolean;
  skeletonCount?: number;
  className?: string;
};

const gridClass =
  "grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";

export function PhotoGrid({
  photos,
  context,
  isLoading = false,
  selectable = false,
  skeletonCount = 18,
  className,
}: PhotoGridProps) {
  const isSelectMode = usePhotoSelectionStore((state) => state.isSelectMode);
  const selectedIds = usePhotoSelectionStore((state) => state.selectedIds);
  const togglePhoto = usePhotoSelectionStore((state) => state.togglePhoto);
  const selectRange = usePhotoSelectionStore((state) => state.selectRange);

  const archive = useArchivePhotos();
  const trash = useTrashPhotos();
  const restore = useRestorePhotos();
  const deleteForever = usePermanentlyDeletePhotos();
  const albumId = context.kind === "album" ? context.albumId : "";
  const removeFromAlbum = useRemovePhotoFromAlbum(albumId);
  const updateAlbum = useUpdateAlbum(albumId);

  const [albumTarget, setAlbumTarget] = useState<Photo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);

  const orderedIds = useMemo(() => photos.map((photo) => photo.id), [photos]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const onToggle = useCallback(
    (photo: Photo, shiftKey: boolean) => {
      if (shiftKey) {
        selectRange(photo.id, orderedIds);
      } else {
        togglePhoto(photo.id);
      }
    },
    [orderedIds, selectRange, togglePhoto],
  );

  const handlers = useMemo<PhotoTileMenuHandlers>(
    () => ({
      onAddToAlbum: (photo) => setAlbumTarget(photo),
      onArchive: (photo) => archive.mutate([photo.id]),
      onTrash: (photo) => trash.mutate([photo.id]),
      onRestore: (photo) => restore.mutate([photo.id]),
      onDeleteForever: (photo) => setDeleteTarget(photo),
      onSetCover: (photo) => updateAlbum.mutate({ coverPhotoId: photo.id }),
      onRemoveFromAlbum: (photo) => removeFromAlbum.mutate(photo.id),
    }),
    [archive, trash, restore, updateAlbum, removeFromAlbum],
  );

  if (isLoading) {
    return (
      <div className={cn(gridClass, className)} aria-busy="true" aria-label="Loading photos">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <PhotoTileSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(gridClass, className)}
        role={selectable ? "group" : undefined}
        aria-label={selectable ? "Photos" : undefined}
      >
        {photos.map((photo, index) => (
          <PhotoTile
            key={photo.id}
            photo={photo}
            context={context}
            selectable={selectable}
            isSelectMode={isSelectMode}
            isSelected={selectedSet.has(photo.id)}
            onToggle={onToggle}
            handlers={handlers}
            priority={index < 6}
          />
        ))}
      </div>

      <AddToAlbumDialog
        open={albumTarget !== null}
        onOpenChange={(open) => !open && setAlbumTarget(null)}
        photoIds={albumTarget ? [albumTarget.id] : []}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete photo forever?"
        description={
          deleteTarget ? (
            <>
              <span className="font-medium text-foreground">{deleteTarget.fileName}</span> will be
              removed from Pixora and from ImageKit. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete forever"
        destructive
        pending={deleteForever.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteForever.mutate([deleteTarget.id], {
            onSettled: () => setDeleteTarget(null),
          });
        }}
      />
    </>
  );
}
