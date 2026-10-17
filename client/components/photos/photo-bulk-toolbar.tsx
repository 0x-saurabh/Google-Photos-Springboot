"use client";

import { useState } from "react";
import {
  Archive,
  CheckSquare,
  FolderMinus,
  FolderPlus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AddToAlbumDialog } from "@/components/albums/add-to-album-dialog";
import type { PhotoContext } from "@/components/photos/photo-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import {
  useArchivePhotos,
  usePermanentlyDeletePhotos,
  useRestorePhotos,
  useTrashPhotos,
} from "@/hooks/use-photos";
import { api } from "@/lib/api";
import { albumKeys } from "@/lib/query-keys";
import { usePhotoSelectionStore } from "@/stores/photo-selection-store";

type PhotoBulkToolbarProps = {
  photoIds: string[];
  context: PhotoContext;
};

function useRemoveManyFromAlbum(albumId: string) {
  const queryClient = useQueryClient();
  const exitSelectMode = usePhotoSelectionStore((state) => state.exitSelectMode);

  return useMutation({
    // The API removes one photo per call; run them in parallel.
    mutationFn: (photoIds: string[]) =>
      Promise.all(photoIds.map((photoId) => api.removePhotoFromAlbum(albumId, photoId))),
    onSuccess: (_, photoIds) => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all });
      exitSelectMode();
      toast.success(
        photoIds.length === 1 ? "Photo removed from album" : `${photoIds.length} photos removed from album`,
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove photos");
    },
  });
}

/**
 * Floating action bar shown while photos are selected.
 * Actions depend on where the grid lives (library status or album).
 */
export function PhotoBulkToolbar({ photoIds, context }: PhotoBulkToolbarProps) {
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selectedIds = usePhotoSelectionStore((state) => state.selectedIds);
  const selectAll = usePhotoSelectionStore((state) => state.selectAll);
  const clearSelection = usePhotoSelectionStore((state) => state.clearSelection);
  const exitSelectMode = usePhotoSelectionStore((state) => state.exitSelectMode);

  const archive = useArchivePhotos();
  const trash = useTrashPhotos();
  const restore = useRestorePhotos();
  const deleteForever = usePermanentlyDeletePhotos();
  const removeFromAlbum = useRemoveManyFromAlbum(context.kind === "album" ? context.albumId : "");

  const isBusy =
    archive.isPending ||
    trash.isPending ||
    restore.isPending ||
    deleteForever.isPending ||
    removeFromAlbum.isPending;

  if (selectedIds.length === 0) {
    return null;
  }

  const status = context.kind === "library" ? context.status : "ACTIVE";
  const allSelected = selectedIds.length === photoIds.length;

  return (
    <>
      <div
        role="toolbar"
        aria-label="Selection actions"
        className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-fit flex-wrap items-center justify-center gap-1 rounded-xl border border-border bg-popover/95 p-1.5 text-popover-foreground shadow-float backdrop-blur-md animate-in fade-in-0 slide-in-from-bottom-2 duration-200 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 md:left-[calc(50%+7.5rem)]"
      >
        <span className="px-2 text-sm font-medium tabular-nums">
          {selectedIds.length} selected
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => (allSelected ? clearSelection() : selectAll(photoIds))}
          disabled={isBusy}
        >
          <CheckSquare />
          {allSelected ? "Deselect all" : "Select all"}
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {status === "ACTIVE" && (
          <>
            <Button variant="ghost" size="sm" onClick={() => setAddToAlbumOpen(true)} disabled={isBusy}>
              <FolderPlus />
              Add to album
            </Button>
            {context.kind === "album" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromAlbum.mutate(selectedIds)}
                disabled={isBusy}
              >
                <FolderMinus />
                Remove from album
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => archive.mutate(selectedIds)} disabled={isBusy}>
              <Archive />
              Archive
            </Button>
            <Button variant="destructive" size="sm" onClick={() => trash.mutate(selectedIds)} disabled={isBusy}>
              <Trash2 />
              Trash
            </Button>
          </>
        )}

        {status === "ARCHIVE" && (
          <>
            <Button variant="ghost" size="sm" onClick={() => restore.mutate(selectedIds)} disabled={isBusy}>
              <RotateCcw />
              Restore
            </Button>
            <Button variant="destructive" size="sm" onClick={() => trash.mutate(selectedIds)} disabled={isBusy}>
              <Trash2 />
              Trash
            </Button>
          </>
        )}

        {status === "TRASH" && (
          <>
            <Button variant="ghost" size="sm" onClick={() => restore.mutate(selectedIds)} disabled={isBusy}>
              <RotateCcw />
              Restore
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} disabled={isBusy}>
              <Trash2 />
              Delete forever
            </Button>
          </>
        )}

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={exitSelectMode}
          disabled={isBusy}
          aria-label="Exit selection"
          title="Exit selection (Esc)"
        >
          <X />
        </Button>
        <Kbd className="mr-1 hidden sm:inline-flex">Esc</Kbd>
      </div>

      <AddToAlbumDialog
        open={addToAlbumOpen}
        onOpenChange={setAddToAlbumOpen}
        photoIds={selectedIds}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${selectedIds.length === 1 ? "this photo" : `${selectedIds.length} photos`} forever?`}
        description="They will be removed from Pixora and from ImageKit. This cannot be undone."
        confirmLabel="Delete forever"
        destructive
        pending={deleteForever.isPending}
        onConfirm={() =>
          deleteForever.mutate(selectedIds, { onSettled: () => setConfirmDelete(false) })
        }
      />
    </>
  );
}
