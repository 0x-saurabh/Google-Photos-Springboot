"use client";

import { FolderOpen } from "lucide-react";
import { AlbumGrid } from "@/components/albums/album-grid";
import { CreateAlbumDialog } from "@/components/albums/create-album-dialog";
import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/error-state";
import { useAlbums } from "@/hooks/use-albums";

export default function AlbumsPage() {
  const { data: albums = [], isLoading, isError, error, refetch, isRefetching } = useAlbums();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Albums"
        description={
          albums.length > 0
            ? `${albums.length} ${albums.length === 1 ? "album" : "albums"}`
            : "Group photos by trip, event or theme"
        }
        actions={<CreateAlbumDialog />}
      />

      {isError ? (
        <ErrorState
          title="Couldn't load your albums"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
          retrying={isRefetching}
        />
      ) : albums.length === 0 && !isLoading ? (
        <Empty className="border border-dashed border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-10 rounded-xl bg-accent text-accent-foreground [&_svg]:size-5">
              <FolderOpen />
            </EmptyMedia>
            <EmptyTitle className="text-base">No albums yet</EmptyTitle>
            <EmptyDescription>
              Create an album, then add photos to it from the library or from the album itself.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateAlbumDialog size="default" />
          </EmptyContent>
        </Empty>
      ) : (
        <AlbumGrid albums={albums} isLoading={isLoading} />
      )}
    </div>
  );
}
