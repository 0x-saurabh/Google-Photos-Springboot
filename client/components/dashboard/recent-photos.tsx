"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoUploadButton } from "@/components/photos/photo-upload-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/error-state";
import { usePhotos } from "@/hooks/use-photos";

const LIMIT = 12;

export function RecentPhotos() {
  const { data, isLoading, isError, error, refetch, isRefetching } = usePhotos("ACTIVE");
  const photos = useMemo(
    () => (data?.pages[0]?.content ?? []).slice(0, LIMIT),
    [data],
  );
  const total = data?.pages[0]?.totalElements ?? 0;

  return (
    <section aria-labelledby="recent-photos-heading" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="recent-photos-heading" className="text-base font-medium text-foreground">
            Recently added
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {total > 0 ? `${total} ${total === 1 ? "photo" : "photos"} in your library` : "Newest uploads appear here"}
          </p>
        </div>
        {total > LIMIT && (
          <Link href="/photos" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            All photos
            <ArrowRight data-icon="inline-end" />
          </Link>
        )}
      </div>

      {isError ? (
        <ErrorState
          title="Couldn't load photos"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
          retrying={isRefetching}
        />
      ) : !isLoading && photos.length === 0 ? (
        <Empty className="border border-dashed border-border bg-muted/30 py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-10 rounded-xl bg-accent text-accent-foreground [&_svg]:size-5">
              <Images />
            </EmptyMedia>
            <EmptyTitle className="text-base">No photos yet</EmptyTitle>
            <EmptyDescription>
              Drop images anywhere on this page or upload from your device to start your library.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <PhotoUploadButton label="Upload photos" />
          </EmptyContent>
        </Empty>
      ) : (
        <PhotoGrid
          photos={photos}
          context={{ kind: "library", status: "ACTIVE" }}
          isLoading={isLoading}
          skeletonCount={LIMIT}
        />
      )}
    </section>
  );
}
