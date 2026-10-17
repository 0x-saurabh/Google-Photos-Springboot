"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckSquare,
  ImagePlus,
  KeyRound,
  Lock,
  LockOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { AlbumLockScreen } from "@/components/albums/album-lock-screen";
import { ChangePinDialog, RemoveLockDialog, SetPinDialog } from "@/components/albums/album-lock-dialogs";
import { AlbumPhotoPickerDialog } from "@/components/albums/album-photo-picker-dialog";
import { AlbumTitleDialog } from "@/components/albums/album-title-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { PhotoBulkToolbar } from "@/components/photos/photo-bulk-toolbar";
import type { PhotoContext } from "@/components/photos/photo-context";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useIntersection } from "@/hooks/use-intersection";
import {
  useAlbum,
  useAlbumPhotos,
  useDeleteAlbum,
  useRelockAlbum,
  useUpdateAlbum,
} from "@/hooks/use-albums";
import { formatDate } from "@/lib/format-date";
import { albumKeys } from "@/lib/query-keys";
import { useAlbumLockStore } from "@/stores/album-lock-store";
import { usePhotoSelectionStore } from "@/stores/photo-selection-store";

function AlbumDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: album, isLoading: isAlbumLoading, isError: isAlbumError, error, refetch, isRefetching } = useAlbum(id);

  // The server decides: a locked album only shows photos when this request carried a live token.
  const needsPin = !!album?.locked && !album.unlocked;
  const {
    data,
    isLoading: arePhotosLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useAlbumPhotos(id, { enabled: !!album && !needsPin });
  const updateAlbum = useUpdateAlbum(id);
  const deleteAlbum = useDeleteAlbum();
  const relock = useRelockAlbum(id);
  const unlockExpiresAt = useAlbumLockStore((state) => state.unlocked[id]?.expiresAt ?? null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [setPinOpen, setSetPinOpen] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [removeLockOpen, setRemoveLockOpen] = useState(false);

  const isSelectMode = usePhotoSelectionStore((state) => state.isSelectMode);
  const enterSelectMode = usePhotoSelectionStore((state) => state.enterSelectMode);
  const exitSelectMode = usePhotoSelectionStore((state) => state.exitSelectMode);

  const photos = useMemo(() => data?.pages.flatMap((page) => page.content) ?? [], [data]);
  const photoIds = useMemo(() => photos.map((photo) => photo.id), [photos]);
  const existingIds = useMemo(() => new Set(photoIds), [photoIds]);

  const context = useMemo<PhotoContext>(
    () => ({ kind: "album", albumId: id, coverPhotoId: album?.coverPhotoId ?? null }),
    [id, album?.coverPhotoId],
  );

  const sentinelRef = useIntersection<HTMLDivElement>(
    () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
    { enabled: !!hasNextPage },
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSelectMode) exitSelectMode();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [exitSelectMode, isSelectMode]);

  // When the unlock token runs out, ask the server again so the PIN screen comes back on its own.
  useEffect(() => {
    if (!unlockExpiresAt) return;
    const delay = Math.max(0, unlockExpiresAt - Date.now()) + 500;
    const timer = window.setTimeout(() => {
      useAlbumLockStore.getState().lock(id);
      queryClient.invalidateQueries({ queryKey: albumKeys.detail(id) });
      queryClient.removeQueries({ queryKey: albumKeys.photos(id) });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [id, queryClient, unlockExpiresAt]);

  // Arrived here from a photo that turned out to be private: continue to it once unlocked.
  const pendingPhoto = searchParams.get("photo");
  useEffect(() => {
    if (pendingPhoto && album && !needsPin) {
      router.replace(`/photos/${pendingPhoto}?album=${id}`);
    }
  }, [album, id, needsPin, pendingPhoto, router]);

  if (isAlbumLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isAlbumError || !album) {
    return (
      <div className="space-y-6">
        <Link href="/albums" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}>
          <ArrowLeft />
          Albums
        </Link>
        <ErrorState
          title="This album could not be loaded"
          description={error instanceof Error ? error.message : "It may have been deleted."}
          onRetry={() => refetch()}
          retrying={isRefetching}
        />
      </div>
    );
  }

  const lockDialogProps = { albumId: album.id, albumTitle: album.title };

  return (
    <div className="space-y-6">
      <Link href="/albums" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}>
        <ArrowLeft />
        Albums
      </Link>

      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            {album.title}
            {album.locked && (
              <Badge variant="secondary" className="gap-1 font-normal">
                {album.unlocked ? <LockOpen className="size-3" /> : <Lock className="size-3" />}
                {album.unlocked ? "Unlocked" : "Private"}
              </Badge>
            )}
          </span>
        }
        description={
          <>
            {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
            <span aria-hidden="true"> · </span>Created {formatDate(album.createdAt)}
          </>
        }
        actions={
          <>
            {!needsPin && photos.length > 0 && (
              <Button
                variant={isSelectMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => (isSelectMode ? exitSelectMode() : enterSelectMode())}
                aria-pressed={isSelectMode}
              >
                <CheckSquare />
                {isSelectMode ? "Done" : "Select"}
              </Button>
            )}
            {album.unlocked && (
              <Button variant="outline" size="sm" onClick={relock}>
                <Lock />
                Lock now
              </Button>
            )}
            {!needsPin && (
              <Button size="sm" onClick={() => setPickerOpen(true)}>
                <ImagePlus />
                Add photos
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="icon-sm" aria-label="Album options" />}
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                {!needsPin && (
                  <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                    <Pencil />
                    Rename
                  </DropdownMenuItem>
                )}
                {album.locked ? (
                  <>
                    {album.unlocked && (
                      <DropdownMenuItem onClick={() => setChangePinOpen(true)}>
                        <KeyRound />
                        Change PIN
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setRemoveLockOpen(true)}>
                      <LockOpen />
                      Remove lock
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => setSetPinOpen(true)}>
                    <Lock />
                    Lock with PIN
                  </DropdownMenuItem>
                )}
                {!needsPin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                      <Trash2 />
                      Delete album
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {needsPin ? (
        <AlbumLockScreen albumId={album.id} photoCount={album.photoCount} />
      ) : photos.length === 0 && !arePhotosLoading ? (
        <Empty className="border border-dashed border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-10 rounded-xl bg-accent text-accent-foreground [&_svg]:size-5">
              <ImagePlus />
            </EmptyMedia>
            <EmptyTitle className="text-base">This album is empty</EmptyTitle>
            <EmptyDescription>
              Add photos from your library. The first one you add becomes the cover unless you choose another.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setPickerOpen(true)}>
              <ImagePlus />
              Add photos
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <PhotoGrid photos={photos} context={context} isLoading={arePhotosLoading} selectable />
          <div ref={sentinelRef} className="flex justify-center py-2">
            {isFetchingNextPage ? (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading more
              </span>
            ) : hasNextPage ? (
              <Button variant="outline" size="sm" onClick={() => fetchNextPage()}>
                Load more
              </Button>
            ) : null}
          </div>
        </>
      )}

      {!needsPin && <PhotoBulkToolbar photoIds={photoIds} context={context} />}

      <AlbumTitleDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        mode="rename"
        initialTitle={album.title}
        pending={updateAlbum.isPending}
        onSubmit={async (title) => {
          if (title !== album.title) await updateAlbum.mutateAsync({ title });
          setRenameOpen(false);
        }}
      />

      <AlbumPhotoPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        albumId={album.id}
        existingIds={existingIds}
      />

      <SetPinDialog open={setPinOpen} onOpenChange={setSetPinOpen} {...lockDialogProps} />
      <ChangePinDialog open={changePinOpen} onOpenChange={setChangePinOpen} {...lockDialogProps} />
      <RemoveLockDialog open={removeLockOpen} onOpenChange={setRemoveLockOpen} {...lockDialogProps} />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${album.title}”?`}
        description="The album will be removed. Photos stay in your library."
        confirmLabel="Delete album"
        destructive
        pending={deleteAlbum.isPending}
        onConfirm={() =>
          deleteAlbum.mutate(album.id, {
            onSuccess: () => router.replace("/albums"),
          })
        }
      />
    </div>
  );
}

export default function AlbumDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      }
    >
      <AlbumDetailContent />
    </Suspense>
  );
}
