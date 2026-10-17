"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAddPhotosToAlbum, useAlbums, useCreateAlbum } from "@/hooks/use-albums";
import { albumCoverSrc } from "@/lib/imagekit";
import { cn } from "@/lib/utils";
import { usePhotoSelectionStore } from "@/stores/photo-selection-store";

type AddToAlbumDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoIds: string[];
};

export function AddToAlbumDialog({ open, onOpenChange, photoIds }: AddToAlbumDialogProps) {
  const { data: albums = [], isLoading } = useAlbums();
  const addMutation = useAddPhotosToAlbum();
  const createMutation = useCreateAlbum();
  const exitSelectMode = usePhotoSelectionStore((state) => state.exitSelectMode);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const pending = addMutation.isPending || createMutation.isPending;

  function close() {
    setSelectedAlbumId(null);
    setCreating(false);
    setNewTitle("");
    onOpenChange(false);
  }

  async function addTo(albumId: string) {
    await addMutation.mutateAsync({ albumId, photoIds });
    exitSelectMode();
    close();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (creating) {
      const title = newTitle.trim();
      if (!title) return;
      const album = await createMutation.mutateAsync(title);
      await addTo(album.id);
      return;
    }
    if (selectedAlbumId) {
      await addTo(selectedAlbumId);
    }
  }

  const count = photoIds.length;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to album</DialogTitle>
          <DialogDescription>
            Choose an album for {count} {count === 1 ? "photo" : "photos"}, or create a new one.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {creating ? (
            <div className="space-y-2">
              <Input
                autoFocus
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Album title"
                aria-label="New album title"
                maxLength={120}
              />
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Choose an existing album instead
              </button>
            </div>
          ) : (
            <div className="scrollbar-thin max-h-72 space-y-1 overflow-y-auto pr-1" role="listbox" aria-label="Albums">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 rounded-lg" />
                ))
              ) : albums.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                  You don&apos;t have any albums yet.
                </p>
              ) : (
                albums.map((album) => {
                  const selected = selectedAlbumId === album.id;
                  return (
                    <button
                      key={album.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => setSelectedAlbumId(album.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                        selected
                          ? "border-primary/60 bg-accent"
                          : "border-transparent hover:bg-muted",
                      )}
                    >
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {album.coverThumbnailUrl ? (
                          <Image
                            src={albumCoverSrc(album.coverThumbnailUrl, 120)}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <FolderOpen className="absolute inset-0 m-auto size-4 text-muted-foreground" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">{album.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
                        </span>
                      </span>
                      {selected && <Check className="size-4 text-primary" />}
                    </button>
                  );
                })
              )}
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Plus className="size-4" />
                </span>
                New album
              </button>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || (creating ? !newTitle.trim() : !selectedAlbumId)}
            >
              {pending ? <Spinner className="size-4" /> : null}
              {creating ? "Create and add" : "Add to album"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
