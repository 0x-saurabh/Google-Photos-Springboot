"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderPlus,
  Info,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { AddToAlbumDialog } from "@/components/albums/add-to-album-dialog";
import {
  contextBackHref,
  photoHref,
  type PhotoContext,
} from "@/components/photos/photo-context";
import { PhotoDetailsPanel } from "@/components/photos/photo-details-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Kbd } from "@/components/ui/kbd";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePhoto } from "@/hooks/use-ai";
import { usePhotoNeighbors } from "@/hooks/use-photo-neighbors";
import {
  useArchivePhotos,
  usePermanentlyDeletePhotos,
  useRestorePhotos,
  useTrashPhotos,
} from "@/hooks/use-photos";
import { cn } from "@/lib/utils";
import { useViewerStore } from "@/stores/viewer-store";

type PhotoViewerProps = {
  photoId: string;
  context: PhotoContext;
};

const stageButton =
  "rounded-full border border-white/15 bg-white/10 text-stage-foreground backdrop-blur-sm hover:bg-white/20 hover:text-stage-foreground dark:hover:bg-white/20 disabled:opacity-30";

/**
 * Full-screen photo viewer. Rendered as an overlay above the workspace shell so
 * the URL stays shareable while the photograph gets the whole viewport.
 */
export function PhotoViewer({ photoId, context }: PhotoViewerProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: photo, isLoading, isError, error, refetch, isRefetching } = usePhoto(photoId);
  const { previous, next, index, total } = usePhotoNeighbors(photoId, context);

  const infoOpen = useViewerStore((state) => state.infoOpen);
  const setInfoOpen = useViewerStore((state) => state.setInfoOpen);
  const toggleInfo = useViewerStore((state) => state.toggleInfo);
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const archive = useArchivePhotos();
  const trash = useTrashPhotos();
  const restore = useRestorePhotos();
  const deleteForever = usePermanentlyDeletePhotos();
  const busy = archive.isPending || trash.isPending || restore.isPending || deleteForever.isPending;

  const backHref = contextBackHref(context);

  const goTo = useCallback(
    (id: string) => router.replace(photoHref(id, context)),
    [context, router],
  );

  /** After removing the photo from this list, move to a neighbour or go back. */
  const leaveTo = useCallback(() => {
    const target = next ?? previous;
    if (target) goTo(target.id);
    else router.replace(backHref);
  }, [backHref, goTo, next, previous, router]);

  // Keyboard navigation.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.key === "ArrowLeft" && previous) goTo(previous.id);
      if (event.key === "ArrowRight" && next) goTo(next.id);
      if (event.key === "Escape") {
        if (infoOpen && isMobile) setInfoOpen(false);
        else router.push(backHref);
      }
      if (event.key.toLowerCase() === "i") toggleInfo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [backHref, goTo, infoOpen, isMobile, next, previous, router, setInfoOpen, toggleInfo]);

  // Warm the cache for the neighbours so stepping feels instant.
  useEffect(() => {
    [previous, next].forEach((neighbour) => {
      if (!neighbour || typeof window === "undefined") return;
      const img = new window.Image();
      img.src = neighbour.url;
    });
  }, [previous, next]);

  // Lock body scroll while the viewer is open.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const panel = photo ? <PhotoDetailsPanel photo={photo} /> : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stage text-stage-foreground" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:px-4">
        <Link
          href={backHref}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "text-stage-foreground/85 hover:bg-white/10 hover:text-stage-foreground dark:hover:bg-white/10" })}
        >
          <ArrowLeft />
          <span className="hidden sm:inline">Back</span>
        </Link>

        <div className="min-w-0 flex-1 text-center">
          {photo && (
            <p className="truncate text-sm text-stage-foreground/90">
              {photo.fileName}
              {index >= 0 && total > 0 && (
                <span className="ml-2 text-stage-foreground/50 tabular-nums">
                  {index + 1} / {total}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {photo?.status === "ACTIVE" && (
            <>
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" className={stageButton} aria-label="Add to album" onClick={() => setAddToAlbumOpen(true)} disabled={busy} />}>
                  <FolderPlus />
                </TooltipTrigger>
                <TooltipContent>Add to album</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" className={stageButton} aria-label="Archive" onClick={() => archive.mutate([photo.id], { onSuccess: leaveTo })} disabled={busy} />}>
                  <Archive />
                </TooltipTrigger>
                <TooltipContent>Archive</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" className={stageButton} aria-label="Move to trash" onClick={() => trash.mutate([photo.id], { onSuccess: leaveTo })} disabled={busy} />}>
                  <Trash2 />
                </TooltipTrigger>
                <TooltipContent>Move to trash</TooltipContent>
              </Tooltip>
            </>
          )}
          {photo?.status === "ARCHIVE" && (
            <>
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" className={stageButton} aria-label="Restore to library" onClick={() => restore.mutate([photo.id], { onSuccess: leaveTo })} disabled={busy} />}>
                  <RotateCcw />
                </TooltipTrigger>
                <TooltipContent>Restore to library</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" className={stageButton} aria-label="Move to trash" onClick={() => trash.mutate([photo.id], { onSuccess: leaveTo })} disabled={busy} />}>
                  <Trash2 />
                </TooltipTrigger>
                <TooltipContent>Move to trash</TooltipContent>
              </Tooltip>
            </>
          )}
          {photo?.status === "TRASH" && (
            <>
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" className={stageButton} aria-label="Restore" onClick={() => restore.mutate([photo.id], { onSuccess: leaveTo })} disabled={busy} />}>
                  <RotateCcw />
                </TooltipTrigger>
                <TooltipContent>Restore</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" className={cn(stageButton, "text-red-300 hover:text-red-200")} aria-label="Delete forever" onClick={() => setConfirmDelete(true)} disabled={busy} />}>
                  <Trash2 />
                </TooltipTrigger>
                <TooltipContent>Delete forever</TooltipContent>
              </Tooltip>
            </>
          )}
          {photo && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open original in a new tab"
                    className={buttonVariants({ variant: "ghost", size: "icon-sm", className: stageButton })}
                  />
                }
              >
                <ExternalLink />
              </TooltipTrigger>
              <TooltipContent>Open original</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={cn(stageButton, infoOpen && "bg-white/25")}
                  aria-label="Toggle details"
                  aria-pressed={infoOpen}
                  onClick={toggleInfo}
                />
              }
            >
              <Info />
            </TooltipTrigger>
            <TooltipContent>
              Details <Kbd>I</Kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 items-center justify-center p-3 sm:p-6">
          {isLoading ? (
            <Spinner className="size-6 text-stage-foreground/60" />
          ) : isError || !photo ? (
            <div className="w-full max-w-md text-foreground">
              <ErrorState
                title="This photo could not be loaded"
                description={error instanceof Error ? error.message : "It may have been deleted."}
                onRetry={() => refetch()}
                retrying={isRefetching}
              />
            </div>
          ) : (
            <Image
              key={photo.id}
              src={photo.url}
              alt={photo.fileName}
              width={photo.width ?? 1600}
              height={photo.height ?? 1200}
              sizes="100vw"
              className="max-h-full w-auto max-w-full object-contain select-none animate-in fade-in-0 duration-300"
              unoptimized
              priority
              draggable={false}
            />
          )}

          {previous && (
            <Button
              variant="ghost"
              size="icon-lg"
              className={cn(stageButton, "absolute top-1/2 left-3 -translate-y-1/2 sm:left-5")}
              aria-label="Previous photo"
              onClick={() => goTo(previous.id)}
            >
              <ChevronLeft className="size-5" />
            </Button>
          )}
          {next && (
            <Button
              variant="ghost"
              size="icon-lg"
              className={cn(stageButton, "absolute top-1/2 right-3 -translate-y-1/2 sm:right-5")}
              aria-label="Next photo"
              onClick={() => goTo(next.id)}
            >
              <ChevronRight className="size-5" />
            </Button>
          )}
        </div>

        {!isMobile && infoOpen && panel && (
          <aside className="scrollbar-thin w-80 shrink-0 overflow-y-auto border-l border-border bg-background p-5 text-foreground animate-in slide-in-from-right-4 fade-in-0 duration-200">
            {panel}
          </aside>
        )}
      </div>

      {isMobile && (
        <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl bg-background p-5 text-foreground">
            <SheetHeader className="sr-only">
              <SheetTitle>Photo details</SheetTitle>
            </SheetHeader>
            {panel}
          </SheetContent>
        </Sheet>
      )}

      {photo && (
        <AddToAlbumDialog
          open={addToAlbumOpen}
          onOpenChange={setAddToAlbumOpen}
          photoIds={[photo.id]}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete photo forever?"
        description="It will be removed from Pixora and from ImageKit. This cannot be undone."
        confirmLabel="Delete forever"
        destructive
        pending={deleteForever.isPending}
        onConfirm={() => {
          if (!photo) return;
          deleteForever.mutate([photo.id], {
            onSuccess: () => {
              setConfirmDelete(false);
              leaveTo();
            },
          });
        }}
      />
    </div>
  );
}
