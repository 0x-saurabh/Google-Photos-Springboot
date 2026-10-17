"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useAddPhotosToAlbum } from "@/hooks/use-albums";
import { usePhotos } from "@/hooks/use-photos";
import { photoThumbnailSrc } from "@/lib/imagekit";
import { cn } from "@/lib/utils";

type AlbumPhotoPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  albumId: string;
  /** Photos already in the album, hidden from the picker. */
  existingIds: Set<string>;
};

/** Pick photos from the main library to add to an album. */
export function AlbumPhotoPickerDialog({
  open,
  onOpenChange,
  albumId,
  existingIds,
}: AlbumPhotoPickerDialogProps) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = usePhotos("ACTIVE", {
    enabled: open,
  });
  const addMutation = useAddPhotosToAlbum();
  const [selected, setSelected] = useState<string[]>([]);

  const candidates = useMemo(
    () =>
      (data?.pages.flatMap((page) => page.content) ?? []).filter(
        (photo) => !existingIds.has(photo.id),
      ),
    [data, existingIds],
  );

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function close() {
    setSelected([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add photos</DialogTitle>
          <DialogDescription>Pick photos from your library to add to this album.</DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin max-h-[60vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="aspect-square animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground">
              Every loaded photo is already in this album.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5" role="group" aria-label="Library photos">
              {candidates.map((photo) => {
                const isSelected = selected.includes(photo.id);
                return (
                  <button
                    key={photo.id}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Deselect" : "Select"} ${photo.fileName}`}
                    onClick={() => toggle(photo.id)}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-popover",
                    )}
                  >
                    <Image
                      src={photoThumbnailSrc(photo, 300)}
                      alt=""
                      fill
                      sizes="140px"
                      className={cn("object-cover transition-transform duration-300", isSelected && "scale-[0.88]")}
                      unoptimized
                    />
                    <span
                      className={cn(
                        "absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full border transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-white/70 bg-black/35 text-transparent group-hover:text-white/70",
                      )}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {hasNextPage && (
            <div className="mt-3 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <Spinner className="size-3.5" /> : null}
                Load more
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <span className="mr-auto self-center text-xs text-muted-foreground tabular-nums">
            {selected.length} selected
          </span>
          <Button variant="outline" onClick={close} disabled={addMutation.isPending}>
            Cancel
          </Button>
          <Button
            disabled={selected.length === 0 || addMutation.isPending}
            onClick={() =>
              addMutation.mutate({ albumId, photoIds: selected }, { onSuccess: close })
            }
          >
            {addMutation.isPending && <Spinner className="size-4" />}
            Add {selected.length > 0 ? selected.length : ""} to album
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
