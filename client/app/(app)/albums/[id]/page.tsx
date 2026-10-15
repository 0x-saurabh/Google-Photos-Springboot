"use client";

import Link from "next/link";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAlbum, useAlbumPhotos } from "@/hooks/use-albums";
import { useParams } from "next/navigation";

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: album, isLoading: isAlbumLoading, isError: isAlbumError } = useAlbum(id);
  const {
    data,
    isLoading: arePhotosLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useAlbumPhotos(id);
  const photos = data?.pages.flatMap((page) => page.content) ?? [];

  if (isAlbumLoading) {
    return <Spinner className="mx-auto mt-12 size-6" />;
  }

  if (isAlbumError || !album) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">This album could not be loaded.</p>
        <Link className={buttonVariants({ variant: "outline" })} href="/albums">
          Back to albums
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link className={buttonVariants({ variant: "ghost", className: "-ml-3" })} href="/albums">
        <ArrowLeft className="size-4" />
        Back to albums
      </Link>
      <div>
        <div className="flex items-center gap-2">
          <FolderOpen className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">{album.title}</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {album.photoCount} photo{album.photoCount === 1 ? "" : "s"}
        </p>
      </div>
      <PhotoGrid
        photos={photos}
        isLoading={arePhotosLoading}
        albumId={album.id}
      />
      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? <Spinner /> : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
