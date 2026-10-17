"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, CheckSquare, CloudDownload, Images, Search, Trash2, X } from "lucide-react";
import { ImportImageKitDialog } from "@/components/library/import-imagekit-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { PhotoBulkToolbar } from "@/components/photos/photo-bulk-toolbar";
import type { PhotoContext } from "@/components/photos/photo-context";
import { PhotoDropzone } from "@/components/photos/photo-dropzone";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoUploadButton } from "@/components/photos/photo-upload-button";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { useIntersection } from "@/hooks/use-intersection";
import { usePhotos } from "@/hooks/use-photos";
import type { PhotoSort, PhotoStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePhotoSelectionStore } from "@/stores/photo-selection-store";

type PhotoLibraryViewProps = {
  title: string;
  description: string;
  status: PhotoStatus;
  emptyTitle: string;
  emptyDescription: string;
  /** Icon for the empty state; a key rather than a component so server pages can pass it. */
  emptyIcon?: "photos" | "archive" | "trash";
  showUpload?: boolean;
};

const emptyIcons = { photos: Images, archive: Archive, trash: Trash2 } as const;

const sortOptions: Array<{ value: PhotoSort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "File name" },
  { value: "largest", label: "Largest file" },
];

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function PhotoLibraryView({
  title,
  description,
  status,
  emptyTitle,
  emptyDescription,
  emptyIcon = "photos",
  showUpload = false,
}: PhotoLibraryViewProps) {
  const EmptyIcon = emptyIcons[emptyIcon];
  const [importOpen, setImportOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<PhotoSort>("newest");
  const query = useDebounced(filter.trim(), 300);
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePhotos(status, { q: query, sort });
  const isSelectMode = usePhotoSelectionStore((state) => state.isSelectMode);
  const enterSelectMode = usePhotoSelectionStore((state) => state.enterSelectMode);
  const exitSelectMode = usePhotoSelectionStore((state) => state.exitSelectMode);
  const selectAll = usePhotoSelectionStore((state) => state.selectAll);

  const photos = useMemo(() => data?.pages.flatMap((page) => page.content) ?? [], [data]);
  const totalPhotos = data?.pages[0]?.totalElements ?? 0;
  const searching = query.length > 0;
  const visibleIds = useMemo(() => photos.map((photo) => photo.id), [photos]);

  const context = useMemo<PhotoContext>(() => ({ kind: "library", status }), [status]);

  const sentinelRef = useIntersection<HTMLDivElement>(
    () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
    { enabled: !!hasNextPage },
  );

  // Keyboard: Esc leaves selection, Cmd/Ctrl+A selects everything visible while selecting.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (event.key === "Escape" && isSelectMode && !typing) {
        exitSelectMode();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a" && isSelectMode && !typing) {
        event.preventDefault();
        selectAll(visibleIds);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [exitSelectMode, isSelectMode, selectAll, visibleIds]);

  // The library is only "empty" when nothing is there at all, not when a search finds nothing.
  const isEmpty = !isLoading && !isError && photos.length === 0 && !searching;
  const noMatches = !isLoading && !isError && photos.length === 0 && searching;
  const countLabel =
    totalPhotos > 0 && !searching
      ? `${totalPhotos} ${totalPhotos === 1 ? "photo" : "photos"}`
      : description;

  const content = (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={countLabel}
        actions={
          <>
            {photos.length > 0 && (
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
            {showUpload && (
              <>
                <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                  <CloudDownload />
                  Import from ImageKit
                </Button>
                <PhotoUploadButton size="sm" label="Upload photos" />
              </>
            )}
          </>
        }
      />

      {showUpload && <ImportImageKitDialog open={importOpen} onOpenChange={setImportOpen} />}

      {(photos.length > 0 || searching || sort !== "newest") && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Search by file name"
              aria-label="Search by file name"
              className="pl-8 pr-8 [&::-webkit-search-cancel-button]:appearance-none"
            />
            {filter && (
              <button
                type="button"
                onClick={() => setFilter("")}
                aria-label="Clear filter"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground tabular-nums">
              {searching
                ? `${totalPhotos} ${totalPhotos === 1 ? "match" : "matches"}`
                : `Showing ${photos.length} of ${totalPhotos}`}
            </p>
            <NativeSelect size="sm" className="w-36" value={sort}
                onChange={(event) => setSort(event.target.value as PhotoSort)}
                aria-label="Sort photos"
              >
                {sortOptions.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
          </div>
        </div>
      )}

      {isError ? (
        <ErrorState
          title="Couldn't load your photos"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
          retrying={isRefetching}
        />
      ) : isEmpty ? (
        <Empty
          className={cn(
            "border border-dashed border-border py-16",
            showUpload && "bg-muted/30",
          )}
        >
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-10 rounded-xl bg-accent text-accent-foreground [&_svg]:size-5">
              <EmptyIcon />
            </EmptyMedia>
            <EmptyTitle className="text-base">{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
          {showUpload && (
            <EmptyContent className="flex-row justify-center">
              <PhotoUploadButton label="Upload photos" />
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <CloudDownload />
                Import from ImageKit
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <>
          {noMatches ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No photos match “{query}”.
            </p>
          ) : (
            <PhotoGrid photos={photos} context={context} isLoading={isLoading} selectable />
          )}

          {!noMatches && (
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
              ) : photos.length > 0 ? (
                <span className="text-xs text-muted-foreground">You&apos;ve reached the end.</span>
              ) : null}
            </div>
          )}
        </>
      )}

      <PhotoBulkToolbar photoIds={visibleIds} context={context} />
    </div>
  );

  return showUpload ? (
    <PhotoDropzone className="-m-2 min-h-[60vh] rounded-xl p-2">{content}</PhotoDropzone>
  ) : (
    content
  );
}
